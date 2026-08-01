# Auditoría de Seguridad MVP

**Proyecto:** Távika  
**Versión auditada:** MVP v1  
**Fecha:** Agosto 2026  
**Auditoría:** Caja Gris (Grey Box)  
**Estado:** Finalizada  

## Objetivo
Realizar una auditoría integral del MVP antes de la apertura a usuarios reales.
La auditoría tuvo cuatro objetivos principales:
- eliminar vulnerabilidades críticas
- ordenar la configuración del proyecto
- separar correctamente los entornos
- establecer una base segura para el crecimiento del sistema

La auditoría se realizó con acceso completo al código fuente. No se trató de una auditoría Black Box.

## Alcance
Se auditó:
- Backend FastAPI
- Frontend Next.js
- OAuth Google
- MercadoPago
- JWT
- Cookies
- CORS
- Variables de entorno
- Railway
- Neon
- OWASP ZAP
- Security Headers
- CSP
- Gestión de secretos
- Arquitectura general

No se auditó:
- infraestructura Railway
- servidores Google
- infraestructura MercadoPago
- disponibilidad
- rendimiento
- escalabilidad

## Metodología
Se utilizó una combinación de:
- revisión manual del código
- análisis estático
- búsqueda de secretos
- revisión arquitectónica
- OWASP ZAP Passive Scan
- pruebas manuales
- revisión de configuración

## Hallazgos iniciales

### Gestión de secretos
Se detectó:
- credenciales hardcodeadas
- URLs de bases de datos en código
- fallbacks inseguros
- variables inconsistentes
- código obsoleto relacionado con Redis

### Variables de entorno
Problemas detectados:
- un único `.env`
- sin separación por entorno
- variables mezcladas
- ausencia de documentación
- incompatibilidad con staging

### Autenticación
Problemas detectados:
JWT enviado mediante URL.
Ejemplo: `/dashboard?token=JWT`

Riesgos:
- historial
- logs
- Referer
- bookmarks

### Autorización
Se detectaron endpoints administrativos públicos.
Ejemplos:
- `/api/admin/colegios`
- `/api/admin/provincias`
- `/api/dashboard/stats`

Sin autenticación.

### Cookies
El frontend almacenaba JWT en LocalStorage.

### CORS
Configuración inicial:
`allow_origins=["*"]`
`allow_credentials=True`

Configuración inválida según el estándar CORS.

### Seguridad HTTP
Ausencia de:
- CSP
- X-Frame-Options
- X-Content-Type-Options
- Permissions Policy

### MercadoPago
Se verificó:
- webhook
- create_preference
- Checkout Pro

## Cambios implementados

### Gestión de secretos
Se eliminaron todas las credenciales reales del repositorio.
Se reemplazaron por:
- variables de entorno
- placeholders
- `.env.example`

### Entornos
Se implementó:
- `.env.development`
- `.env.staging`
- `.env.production`
- `.env.example`

Mediante `APP_ENV` con carga dinámica usando: `python-dotenv`.

### Desarrollo
Se agregaron scripts:
- `run-dev.bat`
- `run-staging.bat`
- `run-production.bat`

### Limpieza
Se eliminó:
- Redis
- Celery
- código muerto
- backups inseguros

### OAuth
Se reemplazó completamente el flujo basado en URL.
**Antes**: token en querystring
**Ahora**: HttpOnly Cookie

### Cookies
Implementación:
- HttpOnly
- SameSite=Lax
- Secure dinámico según entorno
- expiración sincronizada con JWT

### Frontend
Se eliminó:
- LocalStorage
- lectura del token
- Authorization manual

Ahora utiliza: `credentials: include`

### Backend
Se protegieron todos los endpoints administrativos.
Se eliminaron bypasses.
Se eliminó el email administrador hardcodeado.

### CORS
Configuración dinámica basada en:
- `APP_ENV`
- `FRONTEND_URL`

Eliminando wildcard.

### Security Headers
Se implementó:
- CSP
- X-Frame-Options
- X-Content-Type-Options
- Permissions Policy

Compatibles con:
- Google OAuth
- MercadoPago
- Railway

### OWASP ZAP
Se ejecutó: Passive Scan.
Hallazgos: CSP, Headers, Cookies.
Todos corregidos durante la auditoría.

### MercadoPago
Verificaciones realizadas:
- ✔ Access Token sólo backend
- ✔ Checkout Pro
- ✔ Server-to-Server
- ✔ Double Check del webhook
- ✔ Sin exposición de secretos

## Estado actual

**Riesgos críticos**: Ninguno.
**Riesgos altos**: Ninguno.

**Riesgos medios**:
- Replay Attack posible por ausencia de registro de `payment_id`.
- Webhook sin validación HMAC.

**Riesgos bajos**:
- No existe manejo de: refunds, chargebacks.

## Deuda técnica *(Actualización: Ya resuelta en commit posterior)*

**Prioridad Alta**
- [x] Crear tabla `payments` (`Pagos`) con `payment_id` UNIQUE.
- [x] Implementar validación HMAC del webhook.

**Prioridad Media**
- [ ] Registrar historial de pagos.
- [ ] Agregar auditoría de eventos.
- [ ] Agregar rate limiting.
- [ ] Agregar logging estructurado.

**Prioridad Baja**
- [x] Implementar gestión de: refunds, disputes, chargebacks.

## Resultado
La auditoría permitió eliminar todas las vulnerabilidades críticas detectadas antes del lanzamiento del MVP. El proyecto quedó preparado para una primera etapa de pruebas con usuarios reales bajo una arquitectura considerablemente más robusta, con una correcta separación de entornos, gestión segura de secretos, autenticación basada en cookies HttpOnly, protección de rutas administrativas y políticas modernas de seguridad para aplicaciones web.

Creo que este documento es un activo muy valioso. No solo documenta las decisiones tomadas, sino que también deja trazabilidad técnica de por qué se implementó cada cambio y cuál fue el riesgo que mitigó. En un proyecto que evoluciona durante meses o años, ese contexto suele ahorrar muchísimo tiempo cuando toca retomar o revisar la arquitectura.
