from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware
import os
from api import auth, dashboard, admin, payments
from database.database import engine, Base
from database import models

# Crear las tablas en la base de datos automáticamente si no existen
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Távika API")

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

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(admin.router, prefix="/api/admin", tags=["admin"])
app.include_router(payments.router, prefix="/api/payments", tags=["payments"])

@app.get("/")
def read_root():
    return {"message": "Bienvenido a la API de DocentesPro"}

@app.get("/health")
def health_check():
    return {"status": "ok", "db_connected": False} # Todo: Update with actual db check
