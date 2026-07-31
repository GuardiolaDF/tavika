# Historial de Correcciones (Fix History)

Este documento registra cronológicamente las vulnerabilidades solucionadas en el sistema para mantener un registro histórico y prevenir regresiones.

| Fecha | Vulnerabilidad Mitigada | Descripción de la Solución | PR / Commit |
|---|---|---|---|
| 2026-07-28 | Robo de JWT vía XSS | Se eliminó el almacenamiento en `localStorage`. Se migraron los JWT a cookies con banderas `HttpOnly`, `Secure`, y `SameSite=lax`. | N/A |
| 2026-07-31 | Falso positivo CSRF en Local | Se implementó manejo dinámico de la bandera `secure` y `https_only` dependiendo del entorno para permitir testing sin bloqueos de navegadores. | N/A |
