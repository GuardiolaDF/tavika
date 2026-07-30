import os
from celery import Celery
import time
from database.database import SessionLocal
from database.models import Campana, Postulacion, Colegio, Usuario

# Get Redis URL from environment (default to localhost for local dev)
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

celery_app = Celery(
    "tavika_worker",
    broker=REDIS_URL,
    backend=REDIS_URL
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="America/Argentina/Buenos_Aires",
    enable_utc=True,
)

@celery_app.task(bind=True)
def send_campaign_emails(self, campana_id: int):
    """
    Background task to send emails for a specific campaign.
    This will process all pending Postulaciones for the campana_id.
    """
    db = SessionLocal()
    try:
        campana = db.query(Campana).filter(Campana.id == campana_id).first()
        if not campana:
            return f"Campaña {campana_id} no encontrada"
            
        propietario = db.query(Usuario).filter(Usuario.id == campana.propietario_id).first()
        if not propietario:
            return f"Propietario no encontrado"

        postulaciones = db.query(Postulacion).filter(
            Postulacion.campana_id == campana_id,
            Postulacion.estado == "pendiente"
        ).all()
        
        # Aquí en el futuro usaremos google-api-python-client con el refresh_token
        # del propietario para enviar el correo real con su GMail.
        
        for post in postulaciones:
            # TODO: Implemenar el envío de correo con GMail API
            # Simulamos el envío con un delay
            time.sleep(2) # Simulación de delay por envío
            
            # Marcamos como enviado
            post.estado = "enviado"
            db.commit()
            
        # Actualizamos estado de la campaña
        campana.estado = "completado"
        db.commit()
        
        return f"Campaña {campana_id} completada. {len(postulaciones)} correos enviados."
        
    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()
