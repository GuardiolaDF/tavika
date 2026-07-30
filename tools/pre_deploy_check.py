import os
import subprocess
import json
import datetime

def run_command(command, cwd=None):
    try:
        result = subprocess.run(
            command,
            cwd=cwd,
            shell=True,
            capture_output=True,
            text=True,
            timeout=180
        )
        return result.returncode, result.stdout, result.stderr
    except Exception as e:
        return 1, "", str(e)

def generate_report():
    print("Iniciando escaneo de seguridad (Pre-deploy)...")
    report_lines = [
        "# Reporte de Auditoría Pre-Deploy",
        f"Generado: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n",
        "## Resultados de Escaneo\n"
    ]
    
    # 1. Frontend NPM Audit
    print("1/4 Escaneando Node.js (Frontend)...")
    frontend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend')
    code, stdout, stderr = run_command("npm audit --json", cwd=frontend_dir)
    
    if code == 0:
        report_lines.append("- **NPM Audit (Frontend):** ✅ PASA (0 vulnerabilidades críticas)")
    else:
        try:
            audit_data = json.loads(stdout)
            vulns = audit_data.get('metadata', {}).get('vulnerabilities', {})
            critical = vulns.get('critical', 0)
            high = vulns.get('high', 0)
            if critical > 0:
                report_lines.append(f"- **NPM Audit (Frontend):** ❌ FALLA ({critical} críticas, {high} altas)")
            elif high > 0:
                report_lines.append(f"- **NPM Audit (Frontend):** ⚠️ ADVERTENCIA ({high} altas)")
            else:
                report_lines.append("- **NPM Audit (Frontend):** ✅ PASA (Vulnerabilidades menores)")
        except:
            report_lines.append("- **NPM Audit (Frontend):** ⚠️ ADVERTENCIA (Fallo al procesar reporte JSON o npm no instalado)")

    # 2. Backend PIP Audit
    print("2/4 Escaneando Python Dependencies (Backend)...")
    backend_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'backend')
    code, stdout, stderr = run_command("pip-audit", cwd=backend_dir)
    if code == 0:
        report_lines.append("- **PIP Audit (Backend):** ✅ PASA")
    else:
        if "pip-audit: command not found" in stderr or "not recognized" in stderr:
            report_lines.append("- **PIP Audit (Backend):** ⚠️ ADVERTENCIA (pip-audit no está instalado. Corre pip install -r requirements-dev.txt)")
        else:
            report_lines.append("- **PIP Audit (Backend):** ❌ FALLA (Se encontraron dependencias vulnerables)")
            report_lines.append("\n```text\n" + stdout[:500] + "\n```\n")

    # 3. Bandit (Static Analysis)
    print("3/4 Análisis Estático con Bandit (Backend)...")
    code, stdout, stderr = run_command("bandit -r . -f json", cwd=backend_dir)
    if code == 0:
        report_lines.append("- **Bandit SAST:** ✅ PASA")
    else:
        if "not recognized" in stderr:
            report_lines.append("- **Bandit SAST:** ⚠️ ADVERTENCIA (Bandit no instalado)")
        else:
            try:
                bandit_data = json.loads(stdout)
                high_sev = sum(1 for issue in bandit_data.get('results', []) if issue.get('issue_severity') == 'HIGH')
                if high_sev > 0:
                    report_lines.append(f"- **Bandit SAST:** ❌ FALLA ({high_sev} problemas críticos)")
                else:
                    report_lines.append("- **Bandit SAST:** ⚠️ ADVERTENCIA (Problemas menores encontrados)")
            except:
                report_lines.append("- **Bandit SAST:** ❌ FALLA (Errores detectados en análisis)")

    # 4. Escaneo de Archivos Públicos Sensibles
    print("4/4 Buscando archivos sensibles públicos...")
    public_dir = os.path.join(frontend_dir, 'public')
    sensitive_extensions = ['.env', '.sql', '.bak', '.old', '.key', '.pem']
    exposed_files = []
    
    if os.path.exists(public_dir):
        for root, dirs, files in os.walk(public_dir):
            for file in files:
                if any(file.endswith(ext) for ext in sensitive_extensions) or file == '.env':
                    exposed_files.append(os.path.join(root, file))
                    
    if not exposed_files:
        report_lines.append("- **Exposición de Archivos:** ✅ PASA (Cero secretos en carpetas públicas)")
    else:
        report_lines.append(f"- **Exposición de Archivos:** ❌ FALLA (Se encontraron {len(exposed_files)} archivos sensibles)")
        report_lines.append("\nArchivos expuestos encontrados:\n" + "\n".join([f"`{f}`" for f in exposed_files]))

    # Guardar reporte
    docs_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'docs')
    os.makedirs(docs_dir, exist_ok=True)
    report_path = os.path.join(docs_dir, 'PRE_DEPLOY_REPORT.md')
    
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write("\n".join(report_lines))
        
    print(f"\nReporte generado con éxito en: {report_path}")

if __name__ == "__main__":
    generate_report()
