import sqlite3
import os

DB_NAME = "crm_colegios.db"

def get_connection():
    return sqlite3.connect(DB_NAME)

def init_db():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS colegios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT,
            departamento TEXT,
            localidad TEXT,
            direccion TEXT,
            telefono TEXT,
            email TEXT,
            estado TEXT, -- 'Pendiente', 'Enviado', 'Rebotado', 'Actualizado', 'Inubicable'
            origen TEXT  -- 'Padron', 'Web Scraping', etc.
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS configuracion (
            clave TEXT PRIMARY KEY,
            valor TEXT
        )
    """)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS fuentes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            url TEXT UNIQUE
        )
    """)
    conn.commit()
    conn.close()

def clear_db():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM colegios")
    conn.commit()
    conn.close()

def insert_schools(schools_list):
    """Inserta una lista de diccionarios en la base de datos."""
    conn = get_connection()
    cursor = conn.cursor()
    
    for school in schools_list:
        cursor.execute("""
            INSERT INTO colegios (nombre, departamento, localidad, direccion, telefono, email, estado, origen)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            school.get("nombre", ""),
            school.get("departamento", ""),
            school.get("localidad", ""),
            school.get("direccion", ""),
            school.get("telefono", ""),
            school.get("email", ""),
            school.get("estado", "Pendiente"),
            school.get("origen", "Padron")
        ))
        
    conn.commit()
    conn.close()

def get_all_schools(departamento_filter=None, estado_filter=None):
    conn = get_connection()
    cursor = conn.cursor()
    
    query = "SELECT id, nombre, departamento, localidad, direccion, telefono, email, estado, origen FROM colegios WHERE 1=1"
    params = []
    
    if departamento_filter:
        query += " AND departamento = ?"
        params.append(departamento_filter)
        
    if estado_filter:
        if estado_filter == "Actualizado":
            query += " AND estado LIKE '%Actualizado%'"
        else:
            query += " AND estado = ?"
            params.append(estado_filter)
            
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    return rows

def get_unique_departamentos():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT DISTINCT departamento FROM colegios ORDER BY departamento")
    rows = cursor.fetchall()
    conn.close()
    return [r[0] for r in rows if r[0]]

def update_status(school_id, status):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE colegios SET estado = ? WHERE id = ?", (status, school_id))
    conn.commit()
    conn.close()

def update_email_and_status(school_id, new_email, new_status, new_origen):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE colegios SET email = ?, estado = ?, origen = ? WHERE id = ?", (new_email, new_status, new_origen, school_id))
    conn.commit()
    conn.close()

def update_email(school_id, new_email, new_status="Actualizado"):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE colegios SET email = ?, estado = ? WHERE id = ?", (new_email, new_status, school_id))
    conn.commit()
    conn.close()

def get_schools_by_status(status):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, nombre, departamento, localidad, direccion, telefono, email, estado, origen FROM colegios WHERE estado = ?", (status,))
    rows = cursor.fetchall()
    conn.close()
    return rows

def get_schools_by_status(status):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, nombre, departamento, localidad, direccion, telefono, email, estado, origen FROM colegios WHERE estado = ?", (status,))
    rows = cursor.fetchall()
    conn.close()
    return rows

def get_config(clave, default=""):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT valor FROM configuracion WHERE clave = ?", (clave,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return row[0]
    return default

def set_config(clave, valor):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO configuracion (clave, valor) VALUES (?, ?)
        ON CONFLICT(clave) DO UPDATE SET valor=excluded.valor
    """, (clave, valor))
    conn.commit()
    conn.close()

def get_all_fuentes():
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, url FROM fuentes")
    rows = cursor.fetchall()
    conn.close()
    return rows

def add_fuente(url):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO fuentes (url) VALUES (?)", (url,))
        conn.commit()
    except sqlite3.IntegrityError:
        pass # Ignorar duplicados
    finally:
        conn.close()

def remove_fuente(f_id):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM fuentes WHERE id = ?", (f_id,))
    conn.commit()
    conn.close()

# Inicializar BD al importar
init_db()
