import pandas as pd
import numpy as np
from database import insert_schools, clear_db

PADRON_FILE = 'padron_oficial_establecimientos_educativos_die.xlsx'

def import_padron_to_db():
    """Lee el padrón, filtra BA privado y lo inserta en SQLite."""
    try:
        df = pd.read_excel(PADRON_FILE, skiprows=11)
        df.columns = list(df.iloc[0])
        df = df.drop(0)
        
        col_prov = df.columns[0]
        col_sec = df.columns[1]
        col_dep = df.columns[3]
        col_loc = df.columns[5] # Localidad
        col_nom = df.columns[8] # Nombre
        col_dom = df.columns[9] # Domicilio
        col_tel = df.columns[11] # Teléfono
        col_mail = 'Mail'
        
        bsas = df[(df[col_prov] == 'Buenos Aires') & (df[col_sec] == 'Privado')]
        
        bsas = bsas.replace({np.nan: ""})
        
        schools = []
        for _, row in bsas.iterrows():
            schools.append({
                "nombre": str(row.get(col_nom, "")).strip(),
                "departamento": str(row.get(col_dep, "")).strip(),
                "localidad": str(row.get(col_loc, "")).strip(),
                "email": str(row.get(col_mail, "")).strip(),
                "direccion": str(row.get(col_dom, "")).strip(),
                "telefono": str(row.get(col_tel, "")).strip(),
                "estado": "Pendiente",
                "origen": "Padron Nacional"
            })
            
        clear_db() # Borramos datos viejos (si los hubiera)
        insert_schools(schools)
        return True, len(schools)
    except Exception as e:
        return False, str(e)
