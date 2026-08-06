import os
from fastapi import FastAPI
from starlette.middleware.sessions import SessionMiddleware
from starlette.middleware.cors import CORSMiddleware
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware
from api import auth, dashboard, admin, payments, campaigns
from core.audit import AuditLogMiddleware
from database.database import engine, Base
from database import models
from sqlalchemy import text

# Crear las tablas en la base de datos automáticamente si no existen
Base.metadata.create_all(bind=engine)

# Migración rápida para agregar nuevas columnas
try:
    with engine.connect() as conn:
        for col in ["provincia VARCHAR", "ciudad VARCHAR", "distrito VARCHAR", "sector VARCHAR", "nivel VARCHAR", "email VARCHAR", "origen VARCHAR", "estado VARCHAR", "fecha_actualizacion DATETIME"]:
            try:
                conn.execute(text(f"ALTER TABLE colegios ADD COLUMN {col}"))
                conn.commit()
            except:
                conn.rollback()
        for col in ["editado_manualmente BOOLEAN DEFAULT 0", "cue VARCHAR", "tiene_jardin BOOLEAN DEFAULT 0", "tiene_primaria BOOLEAN DEFAULT 0", "tiene_secundaria BOOLEAN DEFAULT 0", "es_tecnica BOOLEAN DEFAULT 0", "es_especial BOOLEAN DEFAULT 0"]:
            try:
                conn.execute(text(f"ALTER TABLE colegios ADD COLUMN {col}"))
                conn.commit()
            except:
                conn.rollback()
        for col in ["cv_filename VARCHAR", "area_estudios VARCHAR", "dni VARCHAR", "telefono VARCHAR", "asunto_template VARCHAR", "cuerpo_template VARCHAR"]:
            try:
                conn.execute(text(f"ALTER TABLE usuarios ADD COLUMN {col}"))
                conn.commit()
            except:
                conn.rollback()
        for col in ["cv_utilizado VARCHAR"]:
            try:
                conn.execute(text(f"ALTER TABLE campanas ADD COLUMN {col}"))
                conn.commit()
            except:
                conn.rollback()
        conn.commit()
except Exception as e:
    pass
import threading
from tasks import process_pending_emails

app = FastAPI(title="Távika API")

@app.on_event("startup")
def startup_event():
    # Iniciar la cola de envíos en un hilo nativo separado para no bloquear el Event Loop asíncrono
    thread = threading.Thread(target=process_pending_emails, daemon=True)
    thread.start()

env_name = os.getenv("APP_ENV", "development")

# OAuth requiere session middleware
# Usamos same_site="lax" y https_only=True en producción porque Google hace un redirect de vuelta
app.add_middleware(
    SessionMiddleware, 
    secret_key=os.getenv("SECRET_KEY", "super-secret-key"),
    same_site="lax",
    https_only=env_name == "production"
)

# Configuración dinámica de CORS según el entorno para cumplir el estándar de cookies seguras

if env_name == "development":
    origins = ["http://localhost:3000"]
else:
    # Staging y Producción toman los orígenes de la variable de entorno
    frontend_urls = os.getenv("FRONTEND_URL", "https://tavika-web-production.up.railway.app")
    origins = [url.strip().rstrip("/") for url in frontend_urls.split(",") if url.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
)

# Fundamental para que FastAPI sepa que está detrás de HTTPS en Railway
# (Debe ser el ÚLTIMO add_middleware para que se ejecute PRIMERO y modifique los headers para todos)
app.add_middleware(ProxyHeadersMiddleware, trusted_hosts=["*"])

if os.getenv("AUDIT_MODE") == "true":
    app.add_middleware(AuditLogMiddleware)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(payments.router, prefix="/api/payments", tags=["payments"])
app.include_router(campaigns.router, prefix="/api/campaigns", tags=["campaigns"])

@app.get("/")
def read_root():
    return {"message": "Bienvenido a la API de DocentesPro"}

@app.get("/health")
def health_check():
    return {"status": "ok", "db_connected": False} # Todo: Update with actual db check
