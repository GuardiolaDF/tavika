import pandas as pd
import numpy as np
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import sys
import os

# Ajustamos el path para poder importar desde backend
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), 'backend')))
from database.models import Colegio, Base

DATABASE_URL = "postgresql://neondb_owner:npg_Xva2JdEZ5QKF@ep-lively-breeze-aut057ir.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require"
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
    for _, row in nacionales.iterrows():
        email_val = str(row.get(col_mail, "")).strip() if col_mail else ""
        if email_val == "nan": email_val = ""
        
        # Si no tiene mail, el estado es "roto" (necesita investigación por parte del email_hunter)
        estado = "sano" if email_val and "@" in email_val else "roto"
        
        colegio = Colegio(
            nombre=str(row.get(col_nom, "")).strip(),
            provincia=str(row.get(col_prov, "")).strip(),
            distrito=str(row.get(col_dep, "")).strip(),
            sector=str(row.get(col_sec, "")).strip(),
            nivel="Secundario" if str(row.get(df.columns[19], "")) == "X" else "Primario",
            email=email_val,
            estado=estado,
            origen="Padron Nacional"
        )
        db.add(colegio)
        count += 1
        
    db.commit()
    db.close()
    print(f"Exito: Importados {count} colegios a Neon DB.")

if __name__ == "__main__":
    import_padron_to_db()
