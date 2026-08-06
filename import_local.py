import pandas as pd
import numpy as np
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys
import os

# Ajustamos el path para poder importar desde backend
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))
from database.models import Colegio, Base

DATABASE_URL = "sqlite:///backend/tavika.db"
engine = create_engine(DATABASE_URL)
Base.metadata.drop_all(bind=engine) # Reseteamos la DB para el nuevo schema
Base.metadata.create_all(bind=engine)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def import_padron_to_db():
    print("Leyendo Excel...")
    df = pd.read_excel('padron_oficial_establecimientos_educativos_die.xlsx', skiprows=11)
    df.columns = list(df.iloc[0])
    df = df.drop(0)
    
    col_prov = df.columns[0]
    col_sec = df.columns[1]
    col_dep = df.columns[3]
    col_loc = df.columns[5] # Localidad
    col_nom = df.columns[8] # Nombre
    col_dom = df.columns[9] # Domicilio
    col_tel = df.columns[11] # Teléfono
    
    # Tratamos de buscar la columna de correo (suele llamarse Mail o Correo Electrónico)
    col_mail = None
    for c in df.columns:
        if isinstance(c, str) and ('mail' in c.lower() or 'correo' in c.lower()):
            col_mail = c
            break
            
    print("Filtrando para todo el país (excluyendo vacíos)...")
    df = df.replace({np.nan: ""})
    # Removemos filas que no sean colegios reales (por si hay basura al final del excel)
    nacionales = df[df[col_prov] != ""]
    
    print(f"Encontrados {len(nacionales)} colegios a nivel nacional. Guardando...")
    db = SessionLocal()
    
    count = 0
    import json
    
    for _, row in nacionales.iterrows():
        email_val = str(row.get(col_mail, "")).strip() if col_mail else ""
        if email_val == "nan": email_val = ""
        
        estado = "sano" if email_val and "@" in email_val else "roto"
        
        # Guardar todos los datos extra en JSON
        # Evitamos los NaN convirtiendo todo a string
        row_dict = {}
        # Make column names unique since 'Primario' repeats
        for i, (col_name, val) in enumerate(row.items()):
            safe_name = str(col_name).strip() if pd.notna(col_name) else f"Col_{i}"
            safe_val = str(val).strip() if pd.notna(val) else ""
            if safe_val and safe_val != "nan":
                # Ensure unique key
                key = safe_name
                counter = 1
                while key in row_dict:
                    key = f"{safe_name}_{counter}"
                    counter += 1
                row_dict[key] = safe_val
        
        datos_extra_json = json.dumps(row_dict, ensure_ascii=False)
        
        # Extraemos variables booleanas clave si tienen una 'X'
        # Viendo los headers, podemos adivinar por indices o nombres.
        # Las X suelen estar en las columnas de modalidades.
        def has_x(col_name):
            val = str(row.get(col_name, "")).strip().upper()
            return val == "X"
            
        colegio = Colegio(
            nombre=str(row.get(col_nom, "")).strip(),
            provincia=str(row.get(col_prov, "")).strip(),
            distrito=str(row.get(col_dep, "")).strip(),
            sector=str(row.get(col_sec, "")).strip(),
            nivel="Secundario" if str(row.get(df.columns[19], "")) == "X" else "Primario",
            email=email_val,
            estado=estado,
            origen="Padron Nacional",
            datos_extra=datos_extra_json,
            # Mapeo simple
            cue=str(row.get('Cueanexo', '')).strip(),
            tiene_jardin=has_x('Nivel inicial - Jardín de infantes'),
            tiene_primaria=has_x('Primario'),
            tiene_secundaria=has_x('Secundario'),
            es_tecnica=has_x('Secundario - INET') or has_x('Formación Profesional - INET'),
            es_especial=has_x('Especial')
        )
        db.add(colegio)
        count += 1
        
    db.commit()
    db.close()
    print(f"Exito: Importados {count} colegios a Neon DB.")

if __name__ == "__main__":
    import_padron_to_db()
