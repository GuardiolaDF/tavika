from sqlalchemy import text
from import_neon import engine

with engine.connect() as conn:
    try:
        conn.execute(text("ALTER TABLE usuarios ADD COLUMN foto_perfil VARCHAR"))
        conn.commit()
        print("Column foto_perfil added successfully.")
    except Exception as e:
        print("Error adding column:", e)
