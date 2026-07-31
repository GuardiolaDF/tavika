# Security Checklist (OWASP ASVS Base - MVP SaaS)

## Autenticación y Gestión de Sesiones
- [ ] Implementación de OAuth2.0 con validación estricta de estado (Prevención CSRF).
- [ ] Uso de JWT con tiempos de expiración cortos (`exp`) y algoritmos robustos.
- [ ] Cookies de sesión configuradas con `HttpOnly`, `Secure` (en producción) y `SameSite=Lax`.
- [ ] Prevención de enumeración de usuarios en los endpoints de login/registro.

## Control de Acceso
- [ ] Validación de roles (`is_admin`) en todas las rutas críticas de la API (Backend).
- [ ] Verificación de propiedad de recursos (ej: usuarios solo pueden ver sus propios datos o campañas).
- [ ] Frontend adaptado para ocultar elementos UI a usuarios sin privilegios (defensa en profundidad).

## Validación de Entrada y Salida
- [ ] Validación estricta de tipos y formatos de entrada mediante Pydantic.
- [ ] Parametrización de consultas a la base de datos (SQLAlchemy ORM) para prevenir Inyección SQL.
- [ ] Cabeceras de seguridad implementadas (CORS restringido a orígenes confiables).

## Criptografía
- [ ] Todas las comunicaciones en producción ocurren a través de HTTPS/TLS.
- [ ] Secretos (ej: JWT Secret, API Keys) inyectados a través de variables de entorno, nunca en código.

## Lógica de Negocio y Pagos (MercadoPago)
- [ ] Validación del origen y firmas de los Webhooks de pagos.
- [ ] Idempotencia en la actualización del estado de pagos para evitar upgrades duplicados.
- [ ] Flujo de fallback en caso de desconexión con el proveedor de pagos.
