import pandas as pd

df = pd.read_excel('padron_oficial_establecimientos_educativos_die.xlsx', skiprows=11)
df.columns = list(df.iloc[0])
df = df.drop(0)

jurisdiccion_col = df.columns[0]
sector_col = df.columns[1]
mail_col = 'Mail'

print("Provincias únicas:", df[jurisdiccion_col].unique())
print("Sectores únicos:", df[sector_col].unique())

bsas = df[(df[jurisdiccion_col] == 'Buenos Aires') & (df[sector_col] == 'Privado')]
print(f"\nColegios privados en Buenos Aires: {len(bsas)}")
print(f"Colegios con Email: {bsas[mail_col].notna().sum()}")
