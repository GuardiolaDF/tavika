# Reporte de Seguridad de Cabeceras (SECURITY HEADERS)

Este documento detalla el estado actual de las cabeceras de seguridad HTTP enviadas por el Backend (FastAPI) y el Frontend (Next.js). No se aplicaron modificaciones automáticas para permitir que el auditor evalúe la línea base.

## Cabeceras Actuales

### Implementadas (FastAPI / CORS Middleware)
- `Access-Control-Allow-Origin`: Configurado actualmente con `["*"]` en MVP. **(Vulnerabilidad moderada detectada)**. Se recomienda fijar al dominio de producción.
- `Access-Control-Allow-Credentials`: `True`.

### Session Cookies (Starlette)
- `HttpOnly`: Implementado. Protege contra robo vía XSS (`document.cookie`).
- `Secure`: Implementado (Forzado vía `https_only=True`).
- `SameSite`: Implementado en `Lax` (Necesario para flujo cruzado OAuth de Google).

## Cabeceras Faltantes Recomendadas (A Auditar)

El auditor deberá comprobar la ausencia de las siguientes cabeceras e indicar cómo afectan el nivel de riesgo en el MVP:

1. **Content-Security-Policy (CSP):**
   - **Faltante:** No hay política estricta sobre de dónde cargar scripts/estilos.
   - **Riesgo:** Alto, aumenta la superficie de XSS.

2. **X-Frame-Options:**
   - **Faltante:** Evita que la página sea embebida en un `<iframe/>`.
   - **Riesgo:** Medio (Clickjacking).

3. **Strict-Transport-Security (HSTS):**
   - **Faltante:** Forzar conexiones exclusivas por HTTPS en el navegador por un período extenso.
   - **Riesgo:** Medio/Bajo (Dado que el hosting ya suele redireccionar HTTP a HTTPS, pero HSTS añade una capa extra en el navegador).

4. **X-Content-Type-Options:**
   - **Faltante:** `nosniff`. Evita ataques de MIME sniffing.
   - **Riesgo:** Bajo.

## Recomendación Post-Auditoría
Tras el análisis del auditor, se recomienda inyectar estas cabeceras:
- En FastAPI: A través de un Custom Middleware o integrando una librería como `secure`.
- En Next.js: Configurando el archivo `next.config.js` en la sección `headers()`.
