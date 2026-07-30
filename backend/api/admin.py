from fastapi import APIRouter, Depends, HTTPException, Security
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database.database import get_db
from database.models import Colegio, Configuracion, Usuario, Campana, Postulacion
from core.security import get_admin_user_jwt
from pydantic import BaseModel
import requests
import json

router = APIRouter()
security = HTTPBearer()

@router.get("/stats")
def get_stats(db: Session = Depends(get_db), admin: Usuario = Depends(get_admin_user_jwt)):
    total = db.query(Colegio).count()
    con_mail = db.query(Colegio).filter(Colegio.email.isnot(None)).count()
    sin_mail = db.query(Colegio).filter(Colegio.email.is_(None)).count()
    verificados = db.query(Colegio).filter(Colegio.estado == "verificado").count()
    rebotados = db.query(Colegio).filter(Colegio.estado == "roto").count()
    return {
        "total": total,
        "con_mail": con_mail,
        "sin_mail": sin_mail,
        "verificados": verificados,
        "rebotados": rebotados
    }

@router.get("/colegios")
def list_colegios(skip: int = 0, limit: int = 100, estado: str = None, provincia: str = None, ciudad: str = None, distrito: str = None, nivel: str = None, q: str = None, admin_view: bool = False, db: Session = Depends(get_db)):
    """ Endpoint para ver el estado de la base de datos de colegios """
    query = db.query(Colegio)
    if not admin_view:
        query = query.filter(Colegio.sector.ilike("%privado%"))
    
    if q:
        query = query.filter(Colegio.nombre.ilike(f"%{q}%"))
        
    if estado:
        if estado == "con_mail":
            query = query.filter(Colegio.email.isnot(None))
        elif estado == "sin_mail":
            query = query.filter(Colegio.email.is_(None))
        else:
            query = query.filter(Colegio.estado == estado)
    if provincia:
        query = query.filter(Colegio.provincia.ilike(f"%{provincia}%"))
    if ciudad:
        query = query.filter(Colegio.ciudad.ilike(f"%{ciudad}%"))
    if distrito:
        query = query.filter(Colegio.distrito.ilike(f"%{distrito}%"))
    if nivel:
        query = query.filter(Colegio.nivel.ilike(f"%{nivel}%"))
    
    colegios = query.offset(skip).limit(limit).all()
    total = query.count()
    
    return {
        "total": total,
        "colegios": colegios
    }

@router.get("/provincias")
def get_provincias(db: Session = Depends(get_db)):
    provincias = db.query(Colegio.provincia).filter(Colegio.provincia.isnot(None)).distinct().order_by(Colegio.provincia).all()
    return [p[0] for p in provincias if p[0]]

@router.get("/ciudades")
def get_ciudades(provincia: str = None, db: Session = Depends(get_db)):
    query = db.query(Colegio.ciudad).filter(Colegio.ciudad.isnot(None))
    if provincia:
        query = query.filter(Colegio.provincia == provincia)
    ciudades = query.distinct().order_by(Colegio.ciudad).all()
    return [c[0] for c in ciudades if c[0]]

@router.get("/distritos")
def get_distritos(provincia: str = None, ciudad: str = None, db: Session = Depends(get_db)):
    query = db.query(Colegio.distrito).filter(Colegio.distrito.isnot(None))
    if provincia:
        query = query.filter(Colegio.provincia == provincia)
    if ciudad:
        query = query.filter(Colegio.ciudad == ciudad)
    distritos = query.distinct().order_by(Colegio.distrito).all()
    return [d[0] for d in distritos if d[0]]

@router.get("/niveles")
def get_niveles(db: Session = Depends(get_db)):
    niveles = db.query(Colegio.nivel).filter(Colegio.nivel.isnot(None)).distinct().order_by(Colegio.nivel).all()
    return [n[0] for n in niveles if n[0]]

@router.post("/clean_bounced")
def clean_bounced_emails(db: Session = Depends(get_db), admin: Usuario = Depends(get_admin_user_jwt)):
    """ Endpoint que dispara el 'cazador' para buscar nuevos emails para colegios con estado=rebotado """
    # Acá encolaríamos la tarea en Celery para el email_hunter
    return {"message": "Limpieza de base de datos encolada. El cazador de correos iniciará pronto."}

class TemplateUpdate(BaseModel):
    asunto: str
    cuerpo: str

@router.get("/template")
def get_template(db: Session = Depends(get_db), admin: Usuario = Depends(get_admin_user_jwt)):
    conf = db.query(Configuracion).filter(Configuracion.clave == "global_template").first()
    if not conf:
        asunto = "Propuesta de valor y colaboración - {{nombre_colegio}}"
        cuerpo = """Hola equipo de {{nombre_colegio}},

Mi nombre es Fabián, soy docente argentino y entiendo perfectamente lo frustrante y difícil que puede ser la búsqueda laboral en nuestro sector, mandando currículums a ciegas sin saber si llegan a destino.

Por eso creé este emprendimiento: una herramienta hecha a pulmón por un colega para ayudar a otros docentes a conectar de forma más directa y eficiente con instituciones como la suya en {{distrito}}, {{ciudad}} ({{provincia}}).

Me encantaría saber si actualmente tienen vacantes en el nivel {{nivel}} o si estarían abiertos a recibir perfiles valiosos que forman parte de nuestra comunidad.

Quedo a su entera disposición y les agradezco de corazón el tiempo.

¡Un saludo enorme!
Fabián"""
        return {"asunto": asunto, "cuerpo": cuerpo}
    return json.loads(conf.valor)

@router.post("/template")
def update_template(data: TemplateUpdate, db: Session = Depends(get_db), admin: Usuario = Depends(get_admin_user_jwt)):
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
def get_system_stats(db: Session = Depends(get_db), admin: Usuario = Depends(get_admin_user_jwt)):
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
