import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), 'tavika.db')

def migrate():
    print(f"Migrating database at {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    try:
        cursor.execute("ALTER TABLE usuarios ADD COLUMN cv_filename VARCHAR")
        print("Added cv_filename to usuarios")
    except Exception as e:
        print(f"Skipped cv_filename: {e}")
        
    try:
        cursor.execute("ALTER TABLE usuarios ADD COLUMN area_estudios VARCHAR")
        print("Added area_estudios to usuarios")
    except Exception as e:
        print(f"Skipped area_estudios: {e}")

    try:
        cursor.execute("ALTER TABLE usuarios ADD COLUMN dni VARCHAR")
        print("Added dni to usuarios")
    except Exception as e:
        print(f"Skipped dni: {e}")

    try:
        cursor.execute("ALTER TABLE usuarios ADD COLUMN telefono VARCHAR")
        print("Added telefono to usuarios")
    except Exception as e:
        print(f"Skipped telefono: {e}")

    try:
        cursor.execute("ALTER TABLE campanas ADD COLUMN cv_utilizado VARCHAR")
        print("Added cv_utilizado to campanas")
    except Exception as e:
        print(f"Skipped cv_utilizado: {e}")

    try:
        cursor.execute("ALTER TABLE usuarios ADD COLUMN foto_perfil VARCHAR")
        print("Added foto_perfil to usuarios")
    except Exception as e:
        print(f"Skipped foto_perfil: {e}")

    conn.commit()
    conn.close()
    print("Migration complete!")

if __name__ == '__main__':
    migrate()
