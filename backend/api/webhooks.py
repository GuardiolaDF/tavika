from fastapi import APIRouter, Request, HTTPException
import json
import os
from svix.webhooks import Webhook, WebhookVerificationError
from database.database import SessionLocal
from database.models import Postulacion, Usuario

router = APIRouter()

@router.post("/resend")
async def resend_webhook(request: Request):
    # Obtener el secreto del webhook de Resend desde variables de entorno
    webhook_secret = os.getenv("RESEND_WEBHOOK_SECRET")
    
    body = await request.body()
    headers = request.headers
    
    if webhook_secret:
        try:
            wh = Webhook(webhook_secret)
            # La librería lanza una excepción si la firma no coincide
            wh.verify(body, headers)
        except WebhookVerificationError:
            raise HTTPException(status_code=401, detail="Invalid webhook signature")
        except Exception as e:
            print(f"Error verificando webhook: {e}")
            raise HTTPException(status_code=400, detail="Webhook error")
    
    try:
        payload = json.loads(body.decode('utf-8'))
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON")

    event_type = payload.get("type")
    data = payload.get("data", {})
    email_id = data.get("email_id")
    
    if not email_id:
        return {"status": "ok", "message": "Ignored, no email_id"}

    db = SessionLocal()
    try:
        postulacion = db.query(Postulacion).filter(Postulacion.resend_id == email_id).first()
        if not postulacion:
            return {"status": "ok", "message": "Postulacion not found"}

        if event_type == "email.bounced":
            postulacion.estado = "rebotado"
            
            # Reintegrar 1 crédito por hard bounce
            campana = postulacion.campana
            if campana:
                propietario = db.query(Usuario).filter(Usuario.id == campana.propietario_id).first()
                if propietario:
                    propietario.creditos_disponibles = (propietario.creditos_disponibles or 0) + 1
                    
        elif event_type == "email.delivered":
            postulacion.estado = "enviado"
            
        elif event_type == "email.complained":
            postulacion.estado = "queja"
            
        db.commit()
    except Exception as e:
        db.rollback()
        print(f"Error processing webhook: {e}")
    finally:
        db.close()
        
    return {"status": "ok"}
