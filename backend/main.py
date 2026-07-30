from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware
import os
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

# OAuth requiere session middleware
# Usamos same_site="lax" y https_only=True porque Google hace un redirect de vuelta (cross-site GET)
# y los navegadores estrictos (como Brave) bloquean third-party cookies si usamos "none".
app.add_middleware(
    SessionMiddleware, 
    secret_key=os.getenv("SECRET_KEY", "super-secret-key"),
    same_site="lax",
    https_only=True
)

# Configuración básica de CORS para que el frontend pueda conectarse
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción se debe restringir a los dominios del frontend
    allow_credentials=True,
    allow_methods=["*"],
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
