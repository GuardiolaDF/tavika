from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database.database import get_db
from database.models import Usuario, Colegio, Campana, Postulacion

router = APIRouter()

# TODO: Add authentication dependency to get current_user
# def get_current_user(...): return Usuario

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db)):
    # Simulación de datos por ahora, hasta que conectemos el current_user real
    # current_user = Depends(get_current_user)
    
    # Total de colegios sanos en la base global
    from database.models import Colegio
    colegios_totales = db.query(Colegio).count()
    if colegios_totales == 0:
        colegios_totales = 3450 # Fake data para ver en la UI hasta tener datos reales
        
    # Fake stats de campañas del usuario
    stats = {
        "mails_enviados": 0,
        "mails_exitosos": 0,
        "colegios_base": colegios_totales,
        "envios_restantes": 50,
        "campanas_recientes": []
    }
    
    return stats
