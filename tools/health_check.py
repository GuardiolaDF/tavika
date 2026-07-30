import os
import requests

def check_staging_health():
    print("Verificando salud del entorno de Staging...")
    issues = []
    
    backend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend')
    env_staging_path = os.path.join(backend_dir, '.env.staging')
    
    if not os.path.exists(env_staging_path):
        issues.append("Falta el archivo .env.staging en backend/.")
    else:
        print("✅ Archivo .env.staging encontrado.")
        with open(env_staging_path, 'r') as f:
            content = f.read()
            if "MERCADOPAGO_ACCESS_TOKEN=APP_USR" not in content and "MERCADOPAGO_ACCESS_TOKEN=TEST" not in content:
                issues.append("No se encontró token de MercadoPago (TEST) en .env.staging.")
            else:
                print("✅ Token MP detectado.")
            if "DATABASE_URL=" not in content:
                issues.append("No se definió DATABASE_URL.")
            else:
                print("✅ DATABASE_URL detectada.")
            if "AUDIT_MODE=true" not in content:
                issues.append("AUDIT_MODE no está activado en .env.staging.")
            else:
                print("✅ AUDIT_MODE está activado.")

    if issues:
        print("\n❌ EL ENTORNO DE STAGING NO ES SEGURO O ESTÁ INCOMPLETO:")
        for issue in issues:
            print(f"  - {issue}")
    else:
        print("\n✅ EL ENTORNO DE STAGING ESTÁ LISTO PARA LA AUDITORÍA.")

if __name__ == "__main__":
    check_staging_health()
