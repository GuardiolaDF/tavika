# Configuración del Entorno de Auditoría (Local Staging)

Este documento detalla la arquitectura del MVP y las instrucciones para desplegar el entorno de pruebas local aislado (Local Staging) para auditorías de seguridad.

## Stack Tecnológico y Arquitectura
- **Frontend:** Next.js (App Router), React, TailwindCSS. (Despliegue final en Vercel o Railway).
- **Backend:** Python 3.11, FastAPI, Uvicorn, SQLAlchemy. (Despliegue final en Railway).
- **Base de Datos:** PostgreSQL. (Alojado en Neon Database).
- **Autenticación:** Google OAuth 2.0 (FastAPI maneja la sesión con cookies HttpOnly/Lax).
- **Pagos:** MercadoPago Sandbox.
- **Workers/Tareas de Fondo:** Hilos nativos de Python (`threading.Thread`) integrados en FastAPI para procesamiento de colas. (No se requiere Redis/Celery).

## Prerrequisitos
- Node.js v18+
- Python 3.11+
- Git

## Instrucciones para Levantar Staging Local

1. **Clonar Repositorio:**
   ```bash
   git clone <URL_DEL_REPO>
   cd buscador_de_escuelas
   ```

2. **Configurar Backend:**
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate  # En Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   pip install -r requirements-dev.txt
   ```

3. **Variables de Entorno Backend:**
   Solicitar los archivos `.env.development`, `.env.staging` y `.env.production` y colocarlos en `/backend`. Cada archivo debe contener credenciales específicas (ver `.env.example`).
   - `DATABASE_URL` (Neon)
   - `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET`.
   - `MP_ACCESS_TOKEN` (Debe ser un token de prueba `TEST-xxx` para dev/staging).
   - `AUDIT_MODE` (Habilitado `true` solo en staging).

4. **Poblar Base de Datos (Seed) - Solo Staging:**
   ```bash
   # Asegúrate de definir APP_ENV antes de correr si no usas el .bat
   $env:APP_ENV="staging"
   python seed_staging.py
   ```
   *Este script inyectará usuarios con cargas XSS, colegios, y roles de prueba.*

5. **Iniciar Backend en distintos entornos:**
   Se han creado scripts automáticos para Windows. Desde la raíz del proyecto, ejecuta:
   - Para Desarrollo: `.\run-dev.bat`
   - Para Staging/Auditoría: `.\run-staging.bat`
   - Para Producción: `.\run-production.bat`
   
   *Si prefieres hacerlo manual:*
   ```powershell
   cd backend
   $env:APP_ENV="staging"
   uvicorn main:app --reload
   ```

6. **Configurar Frontend:**
   ```bash
   cd ../frontend
   npm install
   ```

7. **Variables de Entorno Frontend:**
   Solicitar archivo `.env.local` y colocarlo en `/frontend`.
   - `NEXT_PUBLIC_API_URL=http://localhost:8000`

8. **Iniciar Frontend:**
   ```bash
   npm run dev
   ```
   *El frontend estará disponible en `http://localhost:3000`.*

## Verificación de Salud (Health Check)
Antes de auditar, ejecuta desde la raíz:
```bash
python tools/health_check.py
```
Esto verificará que las credenciales de MP sean Sandbox y que las variables sean correctas.
