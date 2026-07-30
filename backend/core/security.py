import os
import jwt
from datetime import datetime, timedelta
from cryptography.fernet import Fernet

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "super-secret-key-for-local-dev-change-in-prod")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 1 week

FERNET_KEY_STR = os.getenv("FERNET_KEY", Fernet.generate_key().decode())
fernet = Fernet(FERNET_KEY_STR.encode())

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

from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from database.database import get_db
from database.models import Usuario

security = HTTPBearer()

def get_current_user_jwt(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
    email = payload.get("sub")
    user = db.query(Usuario).filter(Usuario.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    return user

def get_admin_user_jwt(current_user: Usuario = Depends(get_current_user_jwt)):
    if not current_user.is_admin and current_user.email != "tavika.app@gmail.com":
        raise HTTPException(status_code=403, detail="No tienes permisos de administrador")
    return current_user
