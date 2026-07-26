from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
import os
from api import auth, dashboard, admin
from database.database import engine, Base
from database import models

# Crear las tablas en la base de datos automáticamente si no existen
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Távika API")

# OAuth requiere session middleware
app.add_middleware(SessionMiddleware, secret_key=os.getenv("SECRET_KEY", "super-secret-key"))

# Configuración básica de CORS para que el frontend pueda conectarse
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # En producción se debe restringir a los dominios del frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Autenticacion"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(admin.router, prefix="/api/admin", tags=["Admin"])

@app.get("/")
def read_root():
    return {"message": "Bienvenido a la API de DocentesPro"}

@app.get("/health")
def health_check():
    return {"status": "ok", "db_connected": False} # Todo: Update with actual db check
