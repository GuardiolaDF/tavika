from fastapi import APIRouter, Depends, HTTPException, Request
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config
from starlette.responses import RedirectResponse
import os
import urllib.parse
from database.database import get_db
from database.models import Usuario
from sqlalchemy.orm import Session
from core.security import create_access_token, encrypt_data, get_current_user_jwt, ACCESS_TOKEN_EXPIRE_MINUTES

router = APIRouter()

# En producción estas variables deben estar en el entorno (Railway)
# Para testeo local necesitaremos crear credenciales en Google Cloud Console
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET", "")

config_data = {
    'GOOGLE_CLIENT_ID': GOOGLE_CLIENT_ID,
    'GOOGLE_CLIENT_SECRET': GOOGLE_CLIENT_SECRET
}
starlette_config = Config(environ=config_data)

client_kwargs_config = {
    'scope': 'openid email profile https://www.googleapis.com/auth/gmail.send'
}

oauth = OAuth(starlette_config)
oauth.register(
    name='google',
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs=client_kwargs_config
)

@router.get("/login")
async def login(request: Request):
    # Limpiamos sesiones viejas para que la cookie no explote por el límite de 4KB de los navegadores
    request.session.clear()
    
    # Genera la URL a la que Google redirigirá después de aceptar los permisos
    redirect_uri = request.url_for('auth_callback')
    
    # Pedimos access_type=offline para que nos de un refresh_token, así Celery puede enviar correos de fondo
    return await oauth.google.authorize_redirect(request, redirect_uri, access_type='offline', prompt='consent')

@router.get("/callback")
async def auth_callback(request: Request, db: Session = Depends(get_db)):
    try:
        token = await oauth.google.authorize_access_token(request)
        user_info = token.get('userinfo')
        
        if not user_info:
            raise HTTPException(status_code=400, detail="Error fetching user info")
            
        user = db.query(Usuario).filter(Usuario.email == user_info.email).first()
        
        # Hardcode admins
        admin_emails = ["tavika.app@gmail.com", "guardiola.dario@gmail.com"]
        is_admin_email = user_info.email in admin_emails
        
        # Extraer imagen y encodearla
        picture_url = user_info.get('picture', '')

        if not user:
            user = Usuario(email=user_info.email, nombre=user_info.get("name", ""), is_admin=is_admin_email, foto_perfil=picture_url)
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            if is_admin_email and not user.is_admin:
                user.is_admin = True
            
            # Update picture if it changed
            if picture_url and user.foto_perfil != picture_url:
                user.foto_perfil = picture_url
                
            db.commit()
            db.refresh(user)
            
        if token.get('refresh_token'):
            user.gmail_token = encrypt_data(token.get('refresh_token'))
            db.commit()
        
        # Crear JWT propio de Távika
        jwt_token = create_access_token({"sub": user.email, "is_admin": user.is_admin})
        
        # Crear Exchange Token (válido 30s)
        from datetime import timedelta
        exchange_token = create_access_token({"exchange_jwt": jwt_token, "is_admin": user.is_admin}, expires_delta=timedelta(seconds=30))
        
        frontend_url = os.getenv("FRONTEND_URL", "https://tavika-web-production.up.railway.app").rstrip("/")
        
        response = RedirectResponse(url=f"{frontend_url}/auth/sync?code={exchange_token}")
        return response
        
    except Exception as e:
        debug_info = {
            "error": str(e),
            "session_keys": list(request.session.keys()) if hasattr(request, "session") else "no_session",
            "url_scheme": request.url.scheme,
            "url": str(request.url),
            "headers": dict(request.headers)
        }
        raise HTTPException(status_code=400, detail=debug_info)

@router.get("/me")
def get_me(user: Usuario = Depends(get_current_user_jwt)):
    return {
        "email": user.email,
        "nombre": user.nombre,
        "is_admin": user.is_admin,
        "plan": user.plan,
        "foto_perfil": user.foto_perfil
    }

from pydantic import BaseModel
from fastapi.responses import JSONResponse

class DevLoginRequest(BaseModel):
    email: str

if os.getenv("APP_ENV") in ("development", "staging"):
    @router.post("/dev-login")
    def dev_login(req: DevLoginRequest, db: Session = Depends(get_db)):
        """
        ATENCIÓN: Endpoint exclusivo para auditorías de seguridad y pentesting.
        Permite generar una cookie de sesión idéntica a la de Google OAuth para cualquier usuario existente.
        Este endpoint nunca se registra ni está disponible en el entorno de producción.
        """
        user = db.query(Usuario).filter(Usuario.email == req.email).first()
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
            
        jwt_token = create_access_token({"sub": user.email, "is_admin": user.is_admin})
        
        response = JSONResponse(content={
            "message": "Dev login exitoso", 
            "email": user.email, 
            "is_admin": user.is_admin
        })
        
        is_production = os.getenv("APP_ENV") == "production"
        samesite_policy = "none" if is_production else "lax"
        
        response.set_cookie(
            key="access_token",
            value=jwt_token,
            httponly=True,
            secure=is_production,
            samesite=samesite_policy,
            max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            path="/"
        )
        return response

@router.post("/logout")
def logout():
    response = JSONResponse(content={"message": "Sesión cerrada"})
    is_production = os.getenv("APP_ENV") == "production"
    # Borrar la cookie fijando max_age a 0
    response.set_cookie(
        key="access_token",
        value="",
        httponly=True,
        secure=is_production,
        samesite="lax",
        max_age=0,
        path="/"
    )
    return response

class ExchangeRequest(BaseModel):
    code: str

@router.post("/exchange")
def exchange_token(req: ExchangeRequest):
    try:
        from core.security import decode_access_token
        payload = decode_access_token(req.code)
        if not payload:
            raise HTTPException(status_code=401, detail="Expired or invalid exchange token")
        
        real_jwt = payload.get("exchange_jwt")
        if not real_jwt:
            raise HTTPException(status_code=400, detail="Invalid token type")
            
        response = JSONResponse(content={"message": "Exchange exitoso", "is_admin": payload.get("is_admin")})
        
        is_production = os.getenv("APP_ENV") == "production"
        # Usamos Lax porque ahora Next.js funciona como First-Party Proxy
        samesite_policy = "lax" 
        
        response.set_cookie(
            key="access_token",
            value=real_jwt,
            httponly=True,
            secure=is_production,
            samesite=samesite_policy,
            max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            path="/"
        )
        return response
    except Exception as e:
        raise HTTPException(status_code=401, detail="Expired or invalid exchange token")

