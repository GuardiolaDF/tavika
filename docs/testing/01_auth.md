# Caso de Prueba: Autenticación y Autorización

## Objetivo
Validar que el flujo de autenticación mediante Google OAuth es robusto, que las cookies se manejan de manera segura y que la protección de rutas administrativas es impenetrable para usuarios sin privilegios.

## TCs (Test Cases)

### TC01: Login Exitoso Vía Google OAuth
- **Pasos:** 
  1. Navegar a `/`. 
  2. Click en "Iniciar Sesión".
  3. Completar flujo en Google.
- **Resultado Esperado:** Redirección a `/dashboard` y generación de una cookie `session` cifrada y con atributos `HttpOnly`, `Secure` (si está en HTTPS).

### TC02: Inaccesibilidad de Rutas Privadas Anónimas
- **Pasos:** 
  1. Estando deslogueado (modo incógnito), intentar acceder a `/dashboard`, `/dashboard/search`, `/dashboard/campaigns/new`.
- **Resultado Esperado:** Redirección inmediata a `/` o mensaje de error 401/403.

### TC03: Autorización Vertical (Privilege Escalation)
- **Pasos:**
  1. Iniciar sesión con un usuario Freemium (`user.freemium@test.com`).
  2. Intentar acceder a la UI de administración en `/admin`.
  3. Intentar hacer una petición GET a `http://localhost:8000/api/admin/stats` mediante Postman interceptando la cookie.
- **Resultado Esperado:** La UI debe redirigir al dashboard normal. La API debe responder con HTTP 403 Forbidden ("Permisos insuficientes").

### TC04: Cierre de Sesión Seguro
- **Pasos:**
  1. Logueado, click en el Dropdown de perfil > "Cerrar sesión".
  2. Intentar regresar (Flecha Back del navegador) al `/dashboard` o hacer F5.
- **Resultado Esperado:** La cookie `session` se borra y el usuario es considerado anónimo. Acceso denegado.
