from fastapi import APIRouter, Request
import mercadopago
import os

import os
from database.database import SessionLocal
from database.models import Usuario

router = APIRouter()

# Iniciamos el SDK de MercadoPago
# Tomamos el token de las variables de entorno de Railway
MP_ACCESS_TOKEN = os.getenv("MP_ACCESS_TOKEN", "TEST-dummy-token")
sdk = mercadopago.SDK(MP_ACCESS_TOKEN)

@router.post("/create_preference")
async def create_preference(request: Request):
    """ Crea el link de pago para la suscripción """
    data = await request.json()
    email = data.get("email")
    preference_data = {
        "items": [
            {
                "title": "Suscripción Távika Pro - 1 Mes",
                "quantity": 1,
                "unit_price": 4999, # Precio actualizado para coincidir con la web
                "currency_id": "ARS"
            }
        ],
        "external_reference": email
    }
    
    try:
        preference_response = sdk.preference().create(preference_data)
        print("MP Response:", preference_response) # Para ver qué responde MercadoPago en los logs
        
        if preference_response["status"] not in (200, 201):
            mp_error = str(preference_response.get("response", "Error desconocido de MP"))
            return {"error": mp_error, "details": preference_response}
            
        preference = preference_response["response"]
        return {"init_point": preference["init_point"], "id": preference["id"]}
    except Exception as e:
        print("Exception MP:", str(e))
        return {"error": str(e)}

@router.post("/webhook")
async def mp_webhook(request: Request):
    """ Recibe las notificaciones de pago desde los servidores de MP """
    data = await request.json()
    print("🔔 Webhook de MercadoPago recibido:", data)
    
    # Check if the notification is about a payment
    if data.get("type") == "payment" or data.get("topic") == "payment":
        payment_id = data.get("data", {}).get("id")
        if payment_id:
            payment_info = sdk.payment().get(payment_id)
            if payment_info["status"] == 200:
                payment = payment_info["response"]
                if payment["status"] == "approved":
                    email = payment.get("external_reference")
                    if email:
                        db = SessionLocal()
                        try:
                            user = db.query(Usuario).filter(Usuario.email == email).first()
                            if user:
                                user.plan = "pro"
                                user.envios_restantes = 1000000 # Unlimited effectively
                                db.commit()
                                print(f"✅ Usuario {email} actualizado a PRO exitosamente.")
                        except Exception as e:
                            print(f"❌ Error al actualizar usuario {email}: {e}")
                            db.rollback()
                        finally:
                            db.close()
    
    return {"status": "ok"}
