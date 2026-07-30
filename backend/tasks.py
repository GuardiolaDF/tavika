import asyncio
from database.database import SessionLocal
from database.models import Campana, Postulacion, Usuario
import traceback

async def process_pending_emails():
    """
    Bucle en segundo plano que revisa la base de datos buscando postulaciones pendientes
    y las envía una por una respetando los límites de tiempo.
    """
    print("🤖 Cola de envíos asíncrona iniciada. Esperando correos...")
    
    while True:
        db = SessionLocal()
        try:
            # Buscar una postulación pendiente
            # Usamos un order_by para procesar en orden de llegada (FIFO)
            post = db.query(Postulacion).filter(Postulacion.estado == "pendiente").order_by(Postulacion.id.asc()).first()
            
            if post:
                campana = db.query(Campana).filter(Campana.id == post.campana_id).first()
                usuario = db.query(Usuario).filter(Usuario.id == campana.propietario_id).first()
                
                print(f"📧 Procesando envío {post.id} de campaña {campana.id} (Usuario: {usuario.email})")
                
                # TODO: Implementar el envío real con la API de Gmail aquí usando usuario.gmail_token
                
                # Simulamos el tiempo de envío y protección anti-spam
                # Hacemos una pausa asíncrona para no bloquear el resto de la web
                await asyncio.sleep(20) # Pausa de 20 segundos
                
                post.estado = "enviado"
                db.commit()
                
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
                await asyncio.sleep(15)
                
        except Exception as e:
            print(f"❌ Error en el procesador de correos: {e}")
            traceback.print_exc()
            db.rollback()
            await asyncio.sleep(15) # Pausa por error para evitar bucles infinitos agresivos
        finally:
            db.close()
