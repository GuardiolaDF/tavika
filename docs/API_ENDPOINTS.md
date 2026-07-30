# Listado de Endpoints (API_ENDPOINTS)

Este documento autogenerado describe la superficie de la API para la auditoría de seguridad.

## Módulo: Autenticación (`/auth`)

### `GET /auth/login`
- **Autenticación requerida:** No
- **Roles:** Todos (Anónimo)
- **Parámetros:** Ninguno
- **Respuesta:** Redirección 302 a Google OAuth.

### `GET /auth/auth`
- **Autenticación requerida:** No (Es el callback de Google)
- **Roles:** Todos
- **Parámetros:** `code` (Query)
- **Respuesta:** Establece cookies de sesión (`session`) y redirige a `/dashboard`.

### `GET /auth/logout`
- **Autenticación requerida:** Sí
- **Roles:** Usuario, Admin
- **Parámetros:** Ninguno
- **Respuesta:** Limpia cookies de sesión y redirige al inicio (`/`).

---

## Módulo: Dashboard y Colegios (`/api/dashboard`)

### `GET /api/dashboard/profile`
- **Autenticación requerida:** Sí (Header `Authorization: Bearer <token>` o vía Cookie en MVP)
- **Roles:** Usuario, Admin
- **Respuesta:** Datos del usuario logueado (plan, email, nombre).

### `GET /api/dashboard/stats`
- **Autenticación requerida:** No estricta (pública en landing page).
- **Respuesta:** Devuelve métricas globales (colegios en base privada, mails enviados).

### `GET /api/dashboard/colegios`
- **Autenticación requerida:** Sí
- **Roles:** Usuario, Admin
- **Parámetros (Query):** `provincia`, `distrito`, `nivel`, `sector`, `q` (búsqueda).
- **Respuesta:** Array de colegios filtrados.

---

## Módulo: Campañas (`/api/campaigns`)

### `POST /api/campaigns/new`
- **Autenticación requerida:** Sí
- **Roles:** Usuario, Admin
- **Parámetros (Body/Form):** `colegios_ids` (List), `pdf` (File), `asunto` (Str), `cuerpo` (Str).
- **Respuesta:** UUID de la campaña creada y mensaje de encolado.

---

## Módulo: Admin (`/api/admin`)

### `GET /api/admin/stats`
- **Autenticación requerida:** Sí
- **Roles:** Admin exclusivamente. (Valida `is_admin == True` en DB).
- **Respuesta:** Métricas desagregadas (sanos, rebotados, faltantes) de la base Privada.

### `GET /api/admin/colegios`
- **Autenticación requerida:** Sí
- **Roles:** Admin exclusivamente.
- **Parámetros (Query):** `estado`, `q`.
- **Respuesta:** Lista paginada/completa para gestión administrativa.

---

## Módulo: Pagos (`/api/payments`)

### `POST /api/payments/create_preference`
- **Autenticación requerida:** Sí
- **Roles:** Usuario, Admin
- **Respuesta:** URL de redirección a Checkout de MercadoPago (Sandbox).

### `POST /api/payments/webhook`
- **Autenticación requerida:** No (Debe ser accesible por servidores de MP).
- **Roles:** N/A (Webhooks).
- **Parámetros (Body):** Notificación IPN de MercadoPago.
- **Respuesta:** 200 OK y actualización del usuario a plan PRO.
- **Riesgo Seguridad:** Debe validar firma (Signature) de MP para evitar falsificación. (Punto crítico de auditoría).
