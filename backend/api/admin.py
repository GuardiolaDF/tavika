from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database.database import get_db
from database.models import Colegio

router = APIRouter()

@router.get("/colegios")
def list_colegios(skip: int = 0, limit: int = 100, estado: str = None, db: Session = Depends(get_db)):
    """ Endpoint para ver el estado de la base de datos de colegios """
    query = db.query(Colegio)
    if estado:
        query = query.filter(Colegio.estado == estado)
    
    colegios = query.offset(skip).limit(limit).all()
    total = query.count()
    
    return {
        "total": total,
        "colegios": colegios
    }

@router.post("/limpiar_rebotes")
def clean_bounced_emails(db: Session = Depends(get_db)):
    """ Endpoint que dispara el 'cazador' para buscar nuevos emails para colegios con estado=rebotado """
    # Acá encolaríamos la tarea en Celery para el email_hunter
    return {"message": "Limpieza de base de datos encolada. El cazador de correos iniciará pronto."}
