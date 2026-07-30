import time
import os
import base64
import datetime
import traceback
from email.message import EmailMessage
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from database.database import SessionLocal
from database.models import Campana, Postulacion, Usuario, Colegio

from core.security import decrypt_data

def process_pending_emails():
    """
    Bucle en segundo plano que revisa la base de datos buscando postulaciones pendientes
    y las envía una por una respetando los límites de tiempo.
    """
    print("🤖 Cola de envíos iniciada en hilo secundario. Esperando correos...")
    
    while True:
        db = SessionLocal()
        try:
            # Buscar una postulación pendiente con bloqueo (FOR UPDATE SKIP LOCKED) para concurrencia
            post = db.query(Postulacion).filter(Postulacion.estado == "pendiente").order_by(Postulacion.id.asc()).with_for_update(skip_locked=True).first()
            
            if post:
                campana = db.query(Campana).filter(Campana.id == post.campana_id).first()
                usuario = db.query(Usuario).filter(Usuario.id == campana.propietario_id).first()
                
                # Límite de seguridad: máximo 400 correos en las últimas 24 horas por usuario (15% menos de los 500 gratuitos de Google)
                ayer = datetime.datetime.utcnow() - datetime.timedelta(hours=24)
                envios_ultimas_24h = db.query(Postulacion).join(Campana).filter(
                    Campana.propietario_id == usuario.id,
                    Postulacion.estado == "enviado",
                    Postulacion.fecha_envio >= ayer
                ).count()

                if envios_ultimas_24h >= 400:
                    print(f"⚠️ Usuario {usuario.email} llegó al límite de 400 correos diarios. Pausando sus envíos.")
                    db.rollback() # liberar el candado
                    db.close()
                    time.sleep(60) # Esperar un minuto antes de revisar otras postulaciones
                    continue
                
                colegio = db.query(Colegio).filter(Colegio.id == post.colegio_id).first()
                if not colegio or not colegio.email or "@" not in colegio.email:
                    print(f"⚠️ Colegio inválido o sin email. Marcando como rebotado.")
                    post.estado = "rebotado"
                    post.fecha_envio = datetime.datetime.utcnow()
                    db.commit()
                    db.close()
                    continue

                print(f"📧 Procesando envío {post.id} de campaña {campana.id} (Usuario: {usuario.email} -> {colegio.email})")
                
                try:
                    # Configurar credenciales desencriptando el refresh_token
                    raw_token = decrypt_data(usuario.gmail_token)
                    if not raw_token:
                        raise Exception("El usuario no tiene token de Gmail válido o no pudo ser desencriptado")
                    
                    creds = Credentials(
                        token=None,
                        refresh_token=raw_token,
                        token_uri="https://oauth2.googleapis.com/token",
                        client_id=os.getenv("GOOGLE_CLIENT_ID"),
                        client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
                    )
                    
                    service = build('gmail', 'v1', credentials=creds)
                    
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
                    
                    # Armar el correo MIME
                    message = EmailMessage()
                    message.set_content(cuerpo_final)
                    message["To"] = colegio.email
                    message["From"] = usuario.email
                    message["Subject"] = asunto_final
                    
                    # Adjuntar CV
                    if campana.cv_utilizado and os.path.exists(campana.cv_utilizado):
                        with open(campana.cv_utilizado, 'rb') as f:
                            pdf_data = f.read()
                        message.add_attachment(
                            pdf_data, 
                            maintype='application', 
                            subtype='pdf', 
                            filename=os.path.basename(campana.cv_utilizado)
                        )
                    
                    encoded_message = base64.urlsafe_b64encode(message.as_bytes()).decode()
                    create_message = {'raw': encoded_message}
                    
                    # Enviar
                    service.users().messages().send(userId="me", body=create_message).execute()
                    
                    post.estado = "enviado"
                    post.fecha_envio = datetime.datetime.utcnow()
                    db.commit()
                    
                    # Pausa de protección anti-spam entre cada correo exitoso
                    time.sleep(25)
                    
                except Exception as mail_error:
                    print(f"❌ Error al enviar correo a {colegio.email}: {mail_error}")
                    post.estado = "rebotado"
                    post.fecha_envio = datetime.datetime.utcnow()
                    db.commit()
                    # Si falla por un rebote, dormimos un poco menos
                    time.sleep(5)
                
                # Revisar si quedan más pendientes en esta campaña
                pendientes = db.query(Postulacion).filter(
                    Postulacion.campana_id == campana.id,
                    Postulacion.estado == "pendiente"
                ).count()
                
                if pendientes == 0:
                    campana.estado = "completado"
                    db.commit()
                    print(f"✅ Campaña {campana.id} completada.")
                    
            else:
                # Si no hay nada pendiente, dormir 15 segundos antes de volver a buscar
                time.sleep(15)
                
        except Exception as e:
            print(f"❌ Error en el procesador de correos: {e}")
            traceback.print_exc()
            db.rollback()
            time.sleep(15) # Pausa por error para evitar bucles infinitos agresivos
        finally:
            db.close()
