# Mapa del Sistema (SYSTEM MAP)

## 1. Frontend (Next.js)
### Páginas y Rutas Principales
- `/`: Landing page (Marketing).
- `/dashboard`: Panel de usuario logueado. Resumen de créditos y colegios.
- `/dashboard/search`: Buscador interactivo de colegios (filtros por nombre, distrito, sector).
- `/dashboard/campaigns/new`: Creador de campañas (Wizard para envío de CV).
- `/admin`: Panel administrativo (solo accesible por usuarios con `is_admin=True`).
- `/privacidad`, `/terminos`: Páginas legales.

### Componentes Clave
- Manejo de estado de filtros (`useSearchParams`, `useState`).
- Componentes de Sidebar y Header con validación de autenticación vía LocalStorage / Cookies.

## 2. Backend (FastAPI)
### Endpoints y Módulos
- **`api/auth.py`**: Manejo del flujo OAuth con Google (`/login`, `/auth`, `/logout`). Manejo de sesión vía cookies seguras.
- **`api/dashboard.py`**: Endpoints para recuperar datos del usuario y estadísticas generales (`/stats`, `/profile`).
- **`api/campaigns.py`**: Lógica core. Recibe postulaciones, crea la campaña en DB, guarda el CV temporalmente y despacha la tarea de envío de correos al worker de fondo.
- **`api/payments.py`**: Integración con MercadoPago (`/create_preference`, `/webhook`). Procesa notificaciones IPN/Webhooks y actualiza planes (ej. `freemium` a `pro`).
- **`api/admin.py`**: Endpoints exclusivos de administrador (`/stats`, `/users`) para ver el estado global.

### Middleware
- `SessionMiddleware`: Gestión de estado de OAuth con `same_site="lax"`, `https_only=True`.
- `CORSMiddleware`: Políticas de intercambio de recursos (Permisivo en MVP, a ser auditado).
- `ProxyHeadersMiddleware`: Detección de protocolo detrás del proxy de Railway (HTTPS).
- `AuditLogMiddleware`: **[Staging Only]** Activado si `AUDIT_MODE=true`. Loguea métricas de cada request.

## 3. Base de Datos (PostgreSQL via Neon)
### Tablas Principales
- **`usuarios`**: Almacena UUID, email, nombre, permisos (`is_admin`), plan, créditos (`envios_restantes`), payload del template y nombre del CV.
- **`colegios`**: Base de datos de instituciones. Columnas clave: `nombre`, `provincia`, `distrito`, `nivel`, `sector`, `email`, `estado` (`sano`, `rebotado`).
- **`campanas`**: Historial de campañas ejecutadas por usuarios, registrando cuántos correos se enviaron y cuál CV se usó.

## 4. Tareas en Segundo Plano (Workers)
- **`tasks.py (process_pending_emails)`**: Un worker ejecutado en un hilo de Python (`threading.Thread`). Monitorea si hay emails que deban enviarse (para emular un espaciamiento orgánico de 30-40 segundos) e interactúa directamente con la DB y el SMTP de Gmail vía API de Google Workspace (OAuth flow offline/refresh tokens, actualmente en desarrollo para MVP).

## 5. Almacenamiento (Storage)
- En el MVP actual, el storage de archivos PDF (CVs) ocurre efímeramente o se vincula mediante Base64/Rutas temporales manejadas por el Backend y destruidas tras el envío, para mantener costos en 0.
