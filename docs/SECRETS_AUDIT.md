# Inventario de Secretos y Keys (SECRETS AUDIT)

A continuación se detalla la matriz de secretos que el sistema utiliza. 
**NOTA DE SEGURIDAD:** Ningún valor real debe estar expuesto en el código fuente. Todos los valores deben cargarse exclusivamente a través de Variables de Entorno (`.env` localmente o Panel de Variables en Railway/Vercel).

## 1. Base de Datos
- **Secreto:** `DATABASE_URL`
- **Uso:** Connection string para que SQLAlchemy se conecte a PostgreSQL.
- **Almacenamiento Seguro:** Backend Environment.
- **Exposición Permitida:** Solo el servicio Backend. NUNCA debe filtrarse al Frontend ni estar en un `NEXT_PUBLIC_`.

## 2. Autenticación (Google OAuth)
- **Secretos:** `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`
- **Uso:** Permitir el flujo de inicio de sesión delegado vía Google.
- **Almacenamiento Seguro:** Backend Environment.
- **Exposición Permitida:** El Client ID puede exponerse en configuraciones de red, pero el Client Secret jamás debe salir del backend.

## 3. Firmas y Sesiones
- **Secreto:** `SECRET_KEY`
- **Uso:** Firmar las cookies de sesión (Starlette SessionMiddleware) y potenciales JWTs en el futuro.
- **Almacenamiento Seguro:** Backend Environment.
- **Exposición Permitida:** Nadie externo. Si se filtra, las sesiones de usuarios pueden ser falsificadas (Session Hijacking).

## 4. Pagos (MercadoPago)
- **Secreto:** `MERCADOPAGO_ACCESS_TOKEN`
- **Uso:** Crear preferencias de pago y validar el estado de órdenes.
- **Almacenamiento Seguro:** Backend Environment.
- **Exposición Permitida:** Solo Backend. **Riesgo Crítico**: Si se filtra, un atacante puede crear devoluciones o alterar flujos de cobro.

- **Secreto:** `MERCADOPAGO_WEBHOOK_SECRET` (A implementar)
- **Uso:** Validar que los POST requests al endpoint de Webhook realmente provengan de los servidores de MP.
- **Exposición Permitida:** Solo Backend.

## 5. Correo Electrónico (Gmail API)
- **Secretos:** `GMAIL_CREDENTIALS_JSON` / Refresh Tokens.
- **Uso:** Enviar correos a las escuelas a nombre del usuario usando tokens offline.
- **Almacenamiento Seguro:** Base de datos cifrada o Variables seguras (actualmente en validación para el MVP).
- **Exposición Permitida:** Ninguna.

## Checklist del Auditor
El auditor debe verificar automáticamente mediante `pre_deploy_check.py` y análisis manual que:
- [ ] No existan archivos `.env` pusheados a GitHub (verificar `.gitignore`).
- [ ] El frontend no tenga variables con prefijo `NEXT_PUBLIC_` que contengan secretos (e.g. Tokens de MercadoPago).
- [ ] No existan strings de contraseñas de BD hardcodeadas en `database.py`.
