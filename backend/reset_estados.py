import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    print("Error: No se encontró DATABASE_URL")
    exit(1)

if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

from database.models import Colegio

db = SessionLocal()
try:
    print("Iniciando reseteo de estados...")
    # Actualizar directamente en la base de datos para ser eficiente
    filas_actualizadas = db.query(Colegio).filter(
        Colegio.estado.in_(['sano', 'verificado'])
    ).update({"estado": None}, synchronize_session=False)
    
    db.commit()
    print(f"¡Éxito! Se han reseteado {filas_actualizadas} colegios. Ahora aparecerán como EXISTENTES y los verificados en cero.")
except Exception as e:
    db.rollback()
    print(f"Error: {e}")
finally:
    db.close()
