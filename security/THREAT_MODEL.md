# Modelo de Amenazas (Threat Model)

## Activos Críticos
- Base de Datos de Usuarios e Información PII (Emails, Datos Personales).
- Historial de Campañas y templates de los usuarios.
- Credenciales de la plataforma (Secretos JWT, MercadoPago Access Tokens).
- Estado de suscripción de los usuarios (Roles y Planes).

## Actores
- **Usuarios Anónimos:** Tienen acceso restringido, pueden intentar enumerar rutas o buscar endpoints expuestos.
- **Usuarios Autenticados (Freemium/Pro):** Buscan elevar privilegios, acceder a datos de otros usuarios, o utilizar características de pago gratuitamente.
- **Administradores:** Poseen acceso total al panel, representan un riesgo alto si sus cuentas son comprometidas.

## Superficie de Ataque
- API Backend expuesta (FastAPI).
- Interfaz Frontend en Next.js.
- Endpoints de autenticación (Google OAuth Callback).
- Webhooks de terceros (MercadoPago).

## Riesgos y Amenazas
- **Riesgo:** Inyección SQL a través de los campos de búsqueda en el dashboard.
- **Riesgo:** Falsificación de Petición en Sitios Cruzados (CSRF) durante el login con OAuth.
- **Riesgo:** Secuestro de sesión mediante robo de JWT por vulnerabilidades XSS en el frontend.
- **Riesgo:** Manipulación de Webhooks para forzar actualizaciones a "Plan Pro" sin pagar.

## Mitigaciones Implementadas
- **Inyección SQL:** Uso de ORM (SQLAlchemy) que parametriza automáticamente los inputs.
- **CSRF / Secuestro de Sesión:** Transición de JWT en LocalStorage a Cookies `HttpOnly`, `Secure` y `SameSite`. Validación estricta del parámetro `state` en Authlib.
- **Roles:** Middleware / Dependencias de validación que bloquean el acceso al Panel Admin sin rol.
