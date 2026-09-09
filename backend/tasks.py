import time
import os
import datetime
import traceback
from database.database import SessionLocal
from database.models import Campana, Postulacion, Usuario, Colegio
from core.email_provider import ResendProvider

def process_pending_emails_batch(limit: int = 50):
    """
    Procesa un lote de correos pendientes y termina.
    Diseñado para ser invocado por Cloud Scheduler o un cron job en lugar de un bucle infinito.
    """
    print(f"[Cola] Procesando lote de hasta {limit} correos pendientes...")
    
    email_provider = ResendProvider()
    processed_count = 0
    
    # Procesar hasta el límite especificado
    for _ in range(limit):
        db = SessionLocal()
        try:
            # Buscar una postulación pendiente con bloqueo (FOR UPDATE SKIP LOCKED) para concurrencia
            post = db.query(Postulacion).filter(Postulacion.estado == "pendiente").order_by(Postulacion.id.asc()).with_for_update(skip_locked=True).first()
            
            if not post:
                # No hay más pendientes
                db.rollback()
                db.close()
                break
                
            campana = db.query(Campana).filter(Campana.id == post.campana_id).first()
            usuario = db.query(Usuario).filter(Usuario.id == campana.propietario_id).first()
            colegio = db.query(Colegio).filter(Colegio.id == post.colegio_id).first()
            
            if not colegio or not colegio.email or "@" not in colegio.email:
                print(f"⚠️ Colegio inválido o sin email. Marcando como rebotado.")
                post.estado = "rebotado"
                post.fecha_envio = datetime.datetime.utcnow()
                # Reintegrar crédito
                usuario.creditos_disponibles = (usuario.creditos_disponibles or 0) + 1
                db.commit()
                db.close()
                continue

            print(f"📧 Procesando envío {post.id} de campaña {campana.id} (Usuario: {usuario.email} -> {colegio.email})")
            
            try:
                # Reemplazo de variables
                nombre_colegio = colegio.nombre or ""
                nombre_colegio = nombre_colegio.replace("COLEGIO", "").replace("INSTITUTO", "").strip()
                
                cuerpo_final = campana.cuerpo_template or ""
                cuerpo_final = cuerpo_final.replace("{{colegio_nombre}}", nombre_colegio)
                cuerpo_final = cuerpo_final.replace("{{nombre}}", usuario.nombre or "")
                cuerpo_final = cuerpo_final.replace("{{area}}", usuario.area_estudios or "")
                
                asunto_final = campana.asunto_template or ""
                asunto_final = asunto_final.replace("{{colegio_nombre}}", nombre_colegio)
                asunto_final = asunto_final.replace("{{nombre}}", usuario.nombre or "")
                asunto_final = asunto_final.replace("{{area}}", usuario.area_estudios or "")
                
                attachment_bytes = None
                attachment_name = None
                if campana.cv_utilizado and os.path.exists(campana.cv_utilizado):
                    with open(campana.cv_utilizado, 'rb') as f:
                        attachment_bytes = f.read()
                    attachment_name = os.path.basename(campana.cv_utilizado)
                
                # Enviar vía Resend
                response = email_provider.send_email(
                    to=colegio.email,
                    subject=asunto_final,
                    text_body=cuerpo_final,
                    html_body=cuerpo_final.replace("\n", "<br>"),
                    reply_to=usuario.email,
                    attachment_bytes=attachment_bytes,
                    attachment_name=attachment_name
                )
                
                post.resend_id = response.get("id")
                post.estado = "enviado" 
                post.fecha_envio = datetime.datetime.utcnow()
                db.commit()
                
                processed_count += 1
                
                # Pausa breve para no saturar la API
                time.sleep(0.5)
                
            except Exception as mail_error:
                print(f"❌ Error al enviar correo a {colegio.email}: {mail_error}")
                post.estado = "error"
                post.fecha_envio = datetime.datetime.utcnow()
                # Reintegrar crédito
                usuario.creditos_disponibles = (usuario.creditos_disponibles or 0) + 1
                db.commit()
            
            # Revisar si quedan más pendientes en esta campaña para marcarla completada
            pendientes = db.query(Postulacion).filter(
                Postulacion.campana_id == campana.id,
                Postulacion.estado == "pendiente"
            ).count()
            
            if pendientes == 0:
                campana.estado = "completado"
                db.commit()
                print(f"✅ Campaña {campana.id} completada.")
                
        except Exception as e:
            print(f"❌ Error en el procesador de correos (lote): {e}")
            traceback.print_exc()
            db.rollback()
        finally:
            db.close()
            
    print(f"[Cola] Lote procesado. Se enviaron {processed_count} correos.")
    return processed_count
