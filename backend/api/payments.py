from fastapi import APIRouter, Request
import mercadopago
import os

router = APIRouter()

# Iniciamos el SDK de MercadoPago
# Tomamos el token de las variables de entorno de Railway
MP_ACCESS_TOKEN = os.getenv("MP_ACCESS_TOKEN", "TEST-dummy-token")
sdk = mercadopago.SDK(MP_ACCESS_TOKEN)

@router.post("/create_preference")
async def create_preference():
    """ Crea el link de pago para la suscripción """
    preference_data = {
        "items": [
            {
                "title": "Suscripción Távika Pro - 1 Mes",
                "quantity": 1,
                "unit_price": 15000, # Precio de ejemplo (AR$ 15.000)
                "currency_id": "ARS"
            }
        ],
        "back_urls": {
            "success": "http://localhost:3002/dashboard?payment=success",
            "failure": "http://localhost:3002/dashboard?payment=failure",
            "pending": "http://localhost:3002/dashboard?payment=pending"
        },
        "auto_return": "approved",
    }
    
    preference_response = sdk.preference().create(preference_data)
    preference = preference_response["response"]
    
    return {"init_point": preference["init_point"], "id": preference["id"]}

@router.post("/webhook")
async def mp_webhook(request: Request):
    """ Recibe las notificaciones de pago desde los servidores de MP """
    data = await request.json()
    print("🔔 Webhook de MercadoPago recibido:", data)
    
    # Aquí iría la lógica para buscar al usuario y cambiarle el plan a "Pro"
    # basándonos en el ID de la transacción.
    
    return {"status": "ok"}
