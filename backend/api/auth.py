from fastapi import APIRouter, Depends, HTTPException
from authlib.integrations.starlette_client import OAuth
from starlette.config import Config
from starlette.requests import Request
from starlette.responses import RedirectResponse
import os

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

oauth = OAuth(starlette_config)
oauth.register(
    name='google',
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={
        # Pedimos scope de email y openid para el login, 
        # y ademas el scope de GMAIL para enviar correos en nombre del usuario
        'scope': 'openid email profile https://www.googleapis.com/auth/gmail.send'
    }
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
async def auth_callback(request: Request):
    try:
        token = await oauth.google.authorize_access_token(request)
        user_info = token.get('userinfo')
        
        if not user_info:
            raise HTTPException(status_code=400, detail="Error fetching user info")
            
        # TODO: Guardar en la DB el usuario y el refresh_token
        # user = db.query(Usuario).filter(email=user_info.email).first()
        # if not user:
        #    user = Usuario(email=user_info.email, ...)
        # user.gmail_token = token.get('refresh_token')
        
        # Redirigir al frontend al dashboard
        frontend_url = os.getenv("FRONTEND_URL", "https://tavika.up.railway.app").rstrip("/")
        return RedirectResponse(url=f"{frontend_url}/dashboard?login=success")
        
    except Exception as e:
        debug_info = {
            "error": str(e),
            "session_keys": list(request.session.keys()) if hasattr(request, "session") else "no_session",
            "url_scheme": request.url.scheme,
            "url": str(request.url),
            "headers": dict(request.headers)
        }
        raise HTTPException(status_code=400, detail=debug_info)
