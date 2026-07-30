# Caso de Prueba: Campañas y Sanitización (XSS/Validaciones)

## Objetivo
Comprobar que el usuario no puede vulnerar el sistema subiendo archivos ilegítimos o explotando el frontend mediante XSS o cargas de datos anómalas (Security Attacker).

## TCs (Test Cases)

### TC01: XSS en Base de Datos (Security Attacker)
- **Pasos:**
  1. Iniciar sesión como `security-auditor@test.com`.
  2. Este usuario tiene como nombre `<img src=x onerror=alert(1)>`.
  3. Navegar por `/dashboard` y `/admin`.
- **Resultado Esperado:** Ninguna alerta de JavaScript debe ejecutarse. React (Next.js) debe renderizar el string literalmente gracias a la auto-sanitización de su DOM virtual.

### TC02: Subida de Archivos No Permitidos (Extensión)
- **Pasos:**
  1. Ir a `/dashboard/campaigns/new`.
  2. En el paso de adjuntar CV, subir un archivo renombrado como `virus.exe`, `script.sh` o un `archivo.php`.
- **Resultado Esperado:** El frontend y backend deben rechazar la petición indicando "Solo se permiten archivos PDF", sin importar si el usuario engaña la extensión manipulando el MIME type (validación en backend).

### TC03: Sobrecarga y Exceso de Limites
- **Pasos:**
  1. Loguearse como `user.freemium@test.com` (10 envíos restantes).
  2. Seleccionar 100 colegios en el filtro.
  3. Presionar Enviar Campaña.
- **Resultado Esperado:** El servidor rechaza la creación de la campaña porque `len(colegios_ids) > envios_restantes`. (No se deben enviar 10 y descartar 90 sin aviso, debe fallar atómicamente).

### TC04: Cadenas Extremadamente Largas (Buffer/Truncation)
- **Pasos:**
  1. Editar el asunto del template con 10,000 caracteres "A".
  2. Enviar postulación.
- **Resultado Esperado:** El sistema debe fallar elegantemente indicando "El asunto es demasiado largo" (Max length validation) y no producir un HTTP 500 fatal crash.
