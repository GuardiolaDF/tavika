import os
os.environ["DATABASE_URL"] = "postgresql://neondb_owner:npg_Xva2JdEZ5QKF@ep-lively-breeze-aut057ir.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require"

try:
    from database.database import engine
    with engine.connect() as conn:
        print("DB Connection OK!")
    
    from main import app
    print("App imported OK!")
except Exception as e:
    print(f"Error: {e}")
