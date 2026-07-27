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

@celery_app.task
def daily_campaign_scheduler():
    """
    Tarea cron diaria (ejecutada a las 9AM).
    Selecciona hasta 400 postulaciones pendientes y las procesa,
    para respetar el límite de Gmail.
    """
    db = SessionLocal()
    try:
        # Buscamos campañas activas (estado="en_progreso" o "pendiente")
        # Por simplicidad, tomamos la primera campaña activa.
        campana = db.query(Campana).filter(Campana.estado.in_(["pendiente", "en_progreso"])).first()
        if not campana:
            print("No hay campañas activas para enviar hoy.")
            return

        # Si estaba pendiente, la pasamos a en_progreso
        if campana.estado == "pendiente":
            campana.estado = "en_progreso"
            db.commit()

        # Seleccionamos entre 300 y 400 colegios de forma aleatoria para no mandar siempre el mismo número
        daily_limit = random.randint(300, 400)
        print(f"Planificando envío de {daily_limit} correos para la campaña {campana.id}")

        pendientes = db.query(Postulacion).filter(
            Postulacion.campana_id == campana.id,
            Postulacion.estado == "pendiente"
        ).limit(daily_limit).all()

        if not pendientes:
            campana.estado = "completado"
            db.commit()
            print(f"Campaña {campana.id} completada.")
            return

        # En lugar de procesarlos aquí sincrónicamente, encolamos cada uno o
        # encolamos un lote. Como ya tenemos 'process_campaign' que toma una campaña entera,
        # necesitamos refactorizar 'process_campaign' o simplemente dejar que 'process_campaign' procese
        # solo los primeros 400.
        
        # Como process_campaign ya hace el ciclo, podemos llamarlo y adentro limitar.
        # Pero para que Celery Beat funcione mejor, llamamos a process_campaign desde aquí.
        celery_app.send_task("workers.email_worker.process_campaign", args=[campana.id, daily_limit])

    except Exception as e:
        print(f"Error en daily scheduler: {e}")
    finally:
        db.close()
