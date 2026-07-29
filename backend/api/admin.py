from fastapi import APIRouter, Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database.database import get_db
from database.models import Colegio, Configuracion, Usuario, Campana, Postulacion
from pydantic import BaseModel
import requests
import json

router = APIRouter()
security = HTTPBearer()

def get_admin_user(credentials: HTTPAuthorizationCredentials = Security(security)):
    token = credentials.credentials
    # Validar el token contra Google
    google_url = f"https://www.googleapis.com/oauth2/v1/userinfo?access_token={token}"
    response = requests.get(google_url)
    
    if response.status_code != 200:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
        
    user_data = response.json()
    email = user_data.get("email")
    
    # MASTER ACCESS LOCK
    if email != "tavika.app@gmail.com":
        raise HTTPException(status_code=403, detail="Acceso denegado. No eres administrador.")
    
    return email

@router.get("/stats")
def get_stats(db: Session = Depends(get_db), admin: str = Depends(get_admin_user)):
    total = db.query(Colegio).count()
    sanos = db.query(Colegio).filter(Colegio.estado == "sano").count()
    rotos = db.query(Colegio).filter(Colegio.estado == "roto").count()
    return {
        "total": total,
        "sanos": sanos,
        "rotos": rotos
    }

@router.get("/colegios")
def list_colegios(skip: int = 0, limit: int = 100, estado: str = None, provincia: str = None, nivel: str = None, db: Session = Depends(get_db), admin: str = Depends(get_admin_user)):
    """ Endpoint para ver el estado de la base de datos de colegios """
    query = db.query(Colegio)
    if estado:
        query = query.filter(Colegio.estado == estado)
    if provincia:
        query = query.filter(Colegio.provincia.ilike(f"%{provincia}%"))
    if nivel:
        query = query.filter(Colegio.nivel.ilike(f"%{nivel}%"))
    
    colegios = query.offset(skip).limit(limit).all()
    total = query.count()
    
    return {
        "total": total,
        "colegios": colegios
    }

@router.post("/limpiar_rebotes")
def clean_bounced_emails(db: Session = Depends(get_db), admin: str = Depends(get_admin_user)):
    """ Endpoint que dispara el 'cazador' para buscar nuevos emails para colegios con estado=rebotado """
    # Acá encolaríamos la tarea en Celery para el email_hunter
    return {"message": "Limpieza de base de datos encolada. El cazador de correos iniciará pronto."}

class TemplateUpdate(BaseModel):
    asunto: str
    cuerpo: str

@router.get("/template")
def get_template(db: Session = Depends(get_db), admin: str = Depends(get_admin_user)):
    conf = db.query(Configuracion).filter(Configuracion.clave == "global_template").first()
    if not conf:
        return {"asunto": "Campaña de Prueba", "cuerpo": "Hola {{nombre_colegio}}"}
    return json.loads(conf.valor)

@router.post("/template")
def update_template(data: TemplateUpdate, db: Session = Depends(get_db), admin: str = Depends(get_admin_user)):
    conf = db.query(Configuracion).filter(Configuracion.clave == "global_template").first()
    valor_json = json.dumps({"asunto": data.asunto, "cuerpo": data.cuerpo})
    if not conf:
        conf = Configuracion(clave="global_template", valor=valor_json)
        db.add(conf)
    else:
        conf.valor = valor_json
    db.commit()
    return {"message": "Plantilla guardada exitosamente"}

@router.get("/system_stats")
def get_system_stats(db: Session = Depends(get_db), admin: str = Depends(get_admin_user)):
    total_usuarios = db.query(Usuario).count()
    usuarios_pro = db.query(Usuario).filter(Usuario.plan == "pro").count()
    total_campanas = db.query(Campana).count()
    total_postulaciones = db.query(Postulacion).count()
    
    # Podriamos traer usuarios por fecha para graficar, pero para el MVP pasamos totales.
    return {
        "usuarios_totales": total_usuarios,
        "usuarios_pro": usuarios_pro,
        "campanas_totales": total_campanas,
        "emails_enviados": total_postulaciones
    }
