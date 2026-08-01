import hmac
import hashlib
from fastapi import APIRouter, Request, HTTPException, Depends
import mercadopago
import os
from database.database import SessionLocal
from database.models import Usuario, Pago
from core.security import get_current_user_jwt

router = APIRouter()

# Iniciamos el SDK de MercadoPago
MP_ACCESS_TOKEN = os.getenv("MP_ACCESS_TOKEN", "TEST-dummy-token")
MP_WEBHOOK_SECRET = os.getenv("MP_WEBHOOK_SECRET")
sdk = mercadopago.SDK(MP_ACCESS_TOKEN)

def validate_signature(request: Request, data_id: str):
    if not MP_WEBHOOK_SECRET:
        # Si no hay secreto configurado, saltamos la validación para no romper funcionalidad actual
        return True
        
    x_signature = request.headers.get("x-signature")
    x_request_id = request.headers.get("x-request-id")
    
    if not x_signature or not x_request_id:
        return False
        
    parts = dict(item.split("=") for item in x_signature.split(",") if "=" in item)
    ts = parts.get("ts")
    v1 = parts.get("v1")
    
    if not ts or not v1:
        return False
        
    manifest = f"id:{data_id};request-id:{x_request_id};ts:{ts};"
    sha = hmac.new(MP_WEBHOOK_SECRET.encode(), manifest.encode(), hashlib.sha256).hexdigest()
    
    return sha == v1

@router.post("/create_preference")
async def create_preference(user: Usuario = Depends(get_current_user_jwt)):
    """ Crea el link de pago para la suscripción """
    email = user.email
    preference_data = {
        "items": [
            {
                "title": "Suscripción Távika Pro - 1 Mes",
                "quantity": 1,
                "unit_price": 4999,
                "currency_id": "ARS"
            }
        ],
        "external_reference": email
    }
    
    try:
        preference_response = sdk.preference().create(preference_data)
        
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
    
    if data.get("type") == "payment" or data.get("topic") == "payment":
        payment_id = data.get("data", {}).get("id")
        
        if payment_id:
            # 1. Validación de Firma HMAC
            if not validate_signature(request, str(payment_id)):
                print("❌ Firma de Webhook inválida o faltante")
                raise HTTPException(status_code=403, detail="Invalid signature")

            # 2. Doble Check: Consultar pago a Mercado Pago
            payment_info = sdk.payment().get(payment_id)
            if payment_info["status"] == 200:
                payment = payment_info["response"]
                email = payment.get("external_reference")
                mp_status = payment.get("status")
                
                if email:
                    db = SessionLocal()
                    try:
                        user = db.query(Usuario).filter(Usuario.email == email).first()
                        if user:
                            # 3. Idempotencia y Registro
                            pago_db = db.query(Pago).filter(Pago.payment_id == str(payment_id)).first()
                            
                            if not pago_db:
                                pago_db = Pago(
                                    payment_id=str(payment_id),
                                    usuario_id=user.id,
                                    estado=mp_status,
                                    monto=payment.get("transaction_amount", 0)
                                )
                                db.add(pago_db)
                            else:
                                if pago_db.estado == mp_status:
                                    # Replay attack o duplicado inofensivo
                                    return {"status": "ok"}
                                pago_db.estado = mp_status
                            
                            # 4. Lógica de Negocio (Manejo de Reembolsos/Aprobaciones)
                            if mp_status == "approved":
                                user.plan = "pro"
                                user.envios_restantes = 1000000
                            elif mp_status in ("refunded", "charged_back", "rejected", "cancelled"):
                                user.plan = "freemium"
                                user.envios_restantes = 10
                            
                            db.commit()
                    except Exception as e:
                        print(f"❌ Error al procesar webhook de pago {payment_id}: {e}")
                        db.rollback()
                    finally:
                        db.close()
    
    return {"status": "ok"}
