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
        
    # Calcular métricas reales del usuario
    postulaciones_usuario = db.query(Postulacion).join(Campana).filter(Campana.propietario_id == user.id).all()
    mails_enviados = len([p for p in postulaciones_usuario if p.estado in ("enviado", "rebotado", "queja", "spam", "error")])
    mails_exitosos = len([p for p in postulaciones_usuario if p.estado == "enviado"])

    stats = {
        "mails_enviados": mails_enviados,
        "mails_exitosos": mails_exitosos,
        "colegios_base": colegios_totales,
        "creditos_disponibles": user.creditos_disponibles or 0,
        "campanas_recientes": []
    }
    
    return stats
