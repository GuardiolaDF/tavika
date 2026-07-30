# Caso de Prueba: Flujo de Pagos (MercadoPago)

## Objetivo
Validar que el sistema procesa pagos únicamente bajo la autorización criptográfica de MP y escala los privilegios de Freemium a PRO exitosamente sin posibilidad de alteraciones manuales por parte del usuario.

## TCs (Test Cases)

### TC01: Creación de Preferencia
- **Pasos:**
  1. Loguearse como `user.freemium@test.com`.
  2. Navegar a precios y presionar "Comprar Pase".
- **Resultado Esperado:** Se redirige al checkout de MercadoPago. La preferencia generada en el backend debe corresponder al UUID correcto del usuario.

### TC02: Simulación de Pago Exitoso (Sandbox)
- **Pasos:**
  1. Estando en el checkout de prueba, usar una tarjeta Sandbox de aprobación (ej: terminada en `1111` provista por la doc de MP).
  2. Esperar confirmación de pago.
- **Resultado Esperado:** El backend procesa el Webhook/IPN de MercadoPago y actualiza el estado de la base de datos `plan='pro'` y `envios_restantes=9999`.

### TC03: Inyección Falsa de Webhook (Bypass Attempt)
- **Pasos:**
  1. El auditor envía un cURL POST falso a `http://localhost:8000/api/payments/webhook` simulando ser MP.
  ```json
  {"type": "payment", "data": {"id": "123456789"}}
  ```
- **Resultado Esperado:** El backend de Staging debe consultar explícitamente a la API real de MercadoPago si el pago `123456789` existe y está Aprobado, o en su defecto verificar el secreto del Webhook. De fallar la validación, descartar la actualización.
