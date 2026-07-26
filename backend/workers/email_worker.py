import time
import random
import smtplib
from email.message import EmailMessage
from .celery_app import celery_app
from database.database import SessionLocal
from database.models import Postulacion, Campana, Usuario

@celery_app.task(bind=True, max_retries=3)
def process_campaign(self, campana_id: int):
    """
    Background task to process a campaign.
    It fetches all pending postulaciones for a campaign and sends them
    with a random organic delay to prevent spam detection.
    """
    db = SessionLocal()
    try:
        campana = db.query(Campana).filter(Campana.id == campana_id).first()
        if not campana:
            return "Campaign not found"
            
        usuario = db.query(Usuario).filter(Usuario.id == campana.propietario_id).first()
        if not usuario or not usuario.gmail_token:
            return "User has no gmail token linked"
            
        # Get pending emails for this campaign
        pendientes = db.query(Postulacion).filter(
            Postulacion.campana_id == campana_id, 
            Postulacion.estado == "pendiente"
        ).all()
        
        # Here we would initialize the Gmail API connection using the usuario.gmail_token
        # For now, this is a placeholder for the actual SMTP/OAuth connection
        # server = connect_to_gmail_oauth(usuario.gmail_token)
        
        for postulacion in pendientes:
            colegio = postulacion.colegio
            if not colegio.email:
                postulacion.estado = "fallido_sin_mail"
                db.commit()
                continue
                
            # Create email content replacing variables to avoid "exact same text" spam filter
            asunto = campana.asunto_template.replace("{Nombre del Colegio}", colegio.nombre)
            cuerpo = campana.cuerpo_template.replace("{Nombre del Colegio}", colegio.nombre)
            
            # TODO: Send email using actual SMTP
            print(f"Enviando correo a {colegio.email} con asunto: {asunto}")
            
            # Mark as sent
            postulacion.estado = "enviado"
            db.commit()
            
            # ORGANIC DELAY: The most critical part of the anti-spam strategy
            # Pause between 20 and 45 seconds randomly
            delay = random.randint(20, 45)
            print(f"Pausa orgánica de {delay} segundos antes del próximo envío...")
            time.sleep(delay)
            
        campana.estado = "completado"
        db.commit()
        return f"Campaign {campana_id} completed."
        
    except Exception as e:
        db.rollback()
        # Retry in case of temporary network failure
        raise self.retry(exc=e, countdown=60)
    finally:
        db.close()
