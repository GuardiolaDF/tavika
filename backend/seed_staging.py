import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database.models import Base, Usuario, Colegio, Campana
from dotenv import load_dotenv

env_name = os.getenv("APP_ENV", "development")
env_path = os.path.join(os.path.dirname(__file__), f".env.{env_name}")
load_dotenv(env_path)

# Asegurar que estamos usando la BD de staging
database_url = os.environ.get("DATABASE_URL")
if not database_url:
    print("Por favor configura DATABASE_URL en tus variables de entorno apuntando a Neon Staging.")
    sys.exit(1)

engine = create_engine(database_url)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def seed_db():
    db = SessionLocal()
    
    # 1. Crear colegios de prueba (Normales y Maliciosos)
    colegios_mock = [
        {"nombre": "Colegio Normal Staging", "provincia": "CABA", "distrito": "Comuna 1", "sector": "Privado", "nivel": "Secundaria", "email": "test@staging.local", "estado": "sano"},
        {"nombre": "Escuela Técnica Falsa", "provincia": "Buenos Aires", "distrito": "La Plata", "sector": "Privado", "nivel": "Primaria", "email": None, "estado": "sano"},
        # Attacker data to test XSS and injection
        {"nombre": "<script>alert('xss colegio')</script>", "provincia": "CABA", "distrito": "Drop Table", "sector": "Privado", "nivel": "Jardín 😈", "email": "evil@hacker.net", "estado": "sano"}
    ]
    
    for c in colegios_mock:
        col = Colegio(**c)
        db.add(col)
        
    # 2. Crear Usuarios de Prueba
    usuarios_mock = [
        {"email": "admin@tavika.app", "nombre": "Admin Staging", "is_admin": True, "plan": "pro"},
        {"email": "user.freemium@test.com", "nombre": "User Freemium", "is_admin": False, "plan": "freemium", "envios_restantes": 10},
        {"email": "user.pro@test.com", "nombre": "User Pro", "is_admin": False, "plan": "pro", "envios_restantes": 9999},
        # Security Attacker profile
        {
            "email": "security-auditor@test.com", 
            "nombre": "Attacker <img src=x onerror=alert(1)>", 
            "is_admin": False, 
            "plan": "freemium",
            "area_estudios": "DROP TABLE usuarios; --",
            "cv_filename": "../../../etc/passwd.pdf",
            "telefono": "1234567890 😈" * 50 # Extreme length
        }
    ]
    
    for u in usuarios_mock:
        user = Usuario(**u)
        db.add(user)
        
    db.commit()
    print("✅ Base de datos de Staging poblada correctamente.")
    print("   - Se insertaron colegios (incluyendo payloads XSS).")
    print("   - Se insertó el usuario 'security-auditor@test.com' con datos anómalos.")
    db.close()

if __name__ == "__main__":
    # Base.metadata.drop_all(bind=engine)
    # Base.metadata.create_all(bind=engine)
    seed_db()
