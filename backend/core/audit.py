import os
import time
import logging
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

# Configurar logger de auditoría
audit_logger = logging.getLogger("audit")
audit_logger.setLevel(logging.INFO)
formatter = logging.Formatter('%(asctime)s - %(message)s')

# Escribir a archivo audit.log (se ignora en git pero útil para el auditor local)
file_handler = logging.FileHandler("audit.log")
file_handler.setFormatter(formatter)
audit_logger.addHandler(file_handler)

class AuditLogMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # 1. Medir tiempo de la request
        start_time = time.time()
        
        # 2. Capturar IP y método
        client_ip = request.client.host if request.client else "Unknown"
        method = request.method
        url = request.url.path
        
        # 3. Identificar usuario si existe token (Sin loggear el token)
        # Nota: Idealmente decodificaríamos el JWT aquí para sacar el email, 
        # pero por simplicidad y no bloquear el flujo, extraemos headers básicos.
        has_auth = "Authorization" in request.headers
        
        # 4. Procesar petición
        response = await call_next(request)
        
        process_time = time.time() - start_time
        status_code = response.status_code
        
        # 5. Formatear y guardar Log
        # NUNCA loggeamos passwords, tokens o data body. Solo metadata HTTP.
        log_message = (
            f"IP: {client_ip} | "
            f"METHOD: {method} | "
            f"ENDPOINT: {url} | "
            f"STATUS: {status_code} | "
            f"DURATION: {process_time:.4f}s | "
            f"AUTH_HEADER_PRESENT: {has_auth}"
        )
        
        audit_logger.info(log_message)
        
        return response
