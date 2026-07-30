import os
from dotenv import load_dotenv

env_name = os.getenv("APP_ENV", "development")
env_path = os.path.join(os.path.dirname(__file__), f".env.{env_name}")
load_dotenv(env_path)
if "DATABASE_URL" not in os.environ:
    os.environ["DATABASE_URL"] = os.getenv("TEST_DATABASE_URL", "sqlite:///./sql_app.db")

try:
    from database.database import engine
    with engine.connect() as conn:
        print("DB Connection OK!")
    
    from main import app
    print("App imported OK!")
except Exception as e:
    print(f"Error: {e}")
