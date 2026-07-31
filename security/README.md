# Seguridad del Proyecto

## Propósito
Esta carpeta está destinada a centralizar y documentar todas las políticas, auditorías, modelos de amenazas y hallazgos relacionados con la seguridad de la aplicación TávikaPro. Mantener este repositorio actualizado es esencial para garantizar un entorno seguro y dar seguimiento a las mitigaciones de riesgos en nuestro MVP SaaS.

## Cómo ejecutar una auditoría
1. **Auditorías Automatizadas (ZAP):** 
   - Utilice OWASP ZAP para realizar escaneos activos y pasivos sobre el entorno de staging.
   - Exporte los reportes generados.
2. **Pruebas Manuales (Pentest):**
   - Ejecute las pruebas descritas en la carpeta `pentest/`.
   - Incluya validaciones de API, controles de acceso y lógica de negocio (especialmente en pagos).
3. **Revisión de Checklist:**
   - Valide el estado actual del proyecto contra el documento `SECURITY_CHECKLIST.md`.

## Dónde guardar los reportes
- **Reportes de Escaneos ZAP:** Guárdelos en `ZAP/reports/`.
- **Sesiones de Escaneo ZAP:** Guárdelas en `ZAP/scans/`.
- **Evidencias Visuales:** Guárdelas en `ZAP/screenshots/`.
- **Registro de Hallazgos:** Ingrese cada nuevo hallazgo y auditoría en `AUDIT_REPORT.md`.
- **Historial de Correcciones:** Una vez solucionado un hallazgo, documéntelo en `FIX_HISTORY.md`.
