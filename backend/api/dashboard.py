from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database.database import get_db
from database.models import Usuario, Colegio, Campana, Postulacion
from core.security import get_current_user_jwt

router = APIRouter()

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db), user: Usuario = Depends(get_current_user_jwt)):
    
    # Total de colegios privados en la base global
    from database.models import Colegio
    colegios_totales = db.query(Colegio).filter(Colegio.sector.ilike("%privado%")).count()
        
    # Fake stats de campañas del usuario
    stats = {
        "mails_enviados": 0,
        "mails_exitosos": 0,
        "colegios_base": colegios_totales,
        "envios_restantes": 10,
        "campanas_recientes": []
    }
    
    return stats
