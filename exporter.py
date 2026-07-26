import pandas as pd
import os

def export_to_excel(data, filename="data/colegios.xlsx"):
    # Ensure directory exists
    os.makedirs(os.path.dirname(filename), exist_ok=True)
    
    df = pd.DataFrame(data, columns=["Colegio", "Departamento", "Localidad", "Direccion", "Telefono", "Email"])
    # Reorder columns if needed
    columns = ["Colegio", "Departamento", "Localidad", "Direccion", "Telefono", "Email"]
    
    # Fill missing columns with empty strings just in case
    for col in columns:
        if col not in df.columns:
            df[col] = ""
            
    df = df[columns]
    
    # Save to Excel
    df.to_excel(filename, index=False, engine='openpyxl')
    print(f"Datos guardados exitosamente en {filename}")
    return filename

def read_from_excel(filename="data/colegios.xlsx"):
    if not os.path.exists(filename):
        return []
    df = pd.read_excel(filename, engine='openpyxl')
    # Replace NaN with empty string
    df = df.fillna("")
    return df.to_dict('records')

def mark_bounces_in_excel(bounced_emails, filename="data/colegios.xlsx"):
    if not os.path.exists(filename):
        return False, "No existe el archivo de colegios."
    
    try:
        df = pd.read_excel(filename, engine='openpyxl')
        if "Estado" not in df.columns:
            df["Estado"] = ""
            
        count = 0
        bounced_emails = [e.lower().strip() for e in bounced_emails]
        
        for idx, row in df.iterrows():
            email = str(row.get("Email", "")).lower().strip()
            if email in bounced_emails:
                df.at[idx, "Estado"] = "Rebotado"
                count += 1
                
        df.to_excel(filename, index=False, engine='openpyxl')
        return True, count
    except Exception as e:
        return False, str(e)
