import sqlite3
import os

db_path = os.path.join(os.path.dirname(__file__), "sql_app.db")

print(f"Migrando {db_path}...")
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

try:
    cursor.execute("ALTER TABLE colegios ADD COLUMN ciudad VARCHAR")
    print("Columna 'ciudad' agregada exitosamente.")
except sqlite3.OperationalError as e:
    if "duplicate column name" in str(e).lower():
        print("La columna 'ciudad' ya existe.")
    else:
        print(f"Error: {e}")

conn.commit()
conn.close()
