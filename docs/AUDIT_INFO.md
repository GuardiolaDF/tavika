# Configuración de Auditoría (AUDIT INFO)

Bienvenido, Auditor/a. Este documento centraliza la información necesaria para realizar pruebas de penetración (pentesting), evaluación de vulnerabilidades y QA de seguridad en el entorno local aislado (Staging).

## URL del Entorno de Pruebas
- **Frontend:** `http://localhost:3000`
- **Backend API:** `http://localhost:8000`
- **Docs Swagger:** `http://localhost:8000/docs`

## Usuarios de Prueba (Generados vía Seed)
Dado que el sistema utiliza autenticación delegada por OAuth, para probar el sistema sin pasar por Google, el Backend en Staging permite forzar el login interno enviando un token con el email directamente (o modificando la DB).

**1. Administrador**
- **Email:** `admin@tavika.app`
- **Privilegios:** Acceso a `/admin`, `is_admin=True`.

**2. Usuario Normal (Freemium)**
- **Email:** `user.freemium@test.com`
- **Límites:** `envios_restantes = 10`.

**3. Usuario Premium (Pro)**
- **Email:** `user.pro@test.com`
- **Límites:** Ilimitado (`9999`).

**4. Security Attacker (Cargas Nocivas)**
- **Email:** `security-auditor@test.com`
- **Contexto:** Este perfil ya está inyectado en la BD con nombres que incluyen XSS (`<img src=x onerror=alert(1)>`), caracteres extraños y payloads SQL. Se debe probar si el Frontend renderiza o escapa correctamente estos datos en el Navbar y en tablas.

## Simulación de Pagos
El proyecto está conectado a **MercadoPago Sandbox**.
Para probar pagos exitosos o fallidos, al llegar al Checkout de MP, utilice las tarjetas de prueba oficiales de MercadoPago (disponibles en la documentación de MP) ingresando cualquier fecha de expiración futura.

## Reseteo del Entorno
Si el entorno de pruebas queda inconsistente:
1. Eliminar la BD SQLite o borrar las tablas en Neon Staging (Drop/Truncate).
2. Volver a correr el seed:
```bash
cd backend
python seed_staging.py
```
