import os
import jwt
from datetime import datetime, timedelta
from cryptography.fernet import Fernet

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "super-secret-key-for-local-dev-change-in-prod")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 1 week

import base64
import hashlib

raw_key = os.getenv("FERNET_KEY")
if raw_key:
    try:
        fernet = Fernet(raw_key.encode())
    except ValueError:
        hashed_key = base64.urlsafe_b64encode(hashlib.sha256(raw_key.encode()).digest())
        fernet = Fernet(hashed_key)
else:
    fernet = Fernet(Fernet.generate_key())

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None

def encrypt_data(data: str) -> str:
    if not data:
        return None
    return fernet.encrypt(data.encode()).decode()

def decrypt_data(data: str) -> str:
    if not data:
        return None
    try:
        return fernet.decrypt(data.encode()).decode()
    except Exception:
        return data # fallback if not encrypted

from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session
from database.database import get_db
from database.models import Usuario

def get_current_user_jwt(request: Request, db: Session = Depends(get_db)):
    auth_header = request.headers.get("Authorization")
    cookie_token = request.cookies.get("access_token")
    
    token = None
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.replace("Bearer ", "")
    elif cookie_token and cookie_token.startswith("Bearer "):
        token = cookie_token.replace("Bearer ", "")
        
    if not token:
        raise HTTPException(status_code=401, detail="No autenticado")
        
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
    email = payload.get("sub")
    user = db.query(Usuario).filter(Usuario.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user

def get_admin_user_jwt(current_user: Usuario = Depends(get_current_user_jwt)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="No tienes permisos de administrador")
    return current_user
