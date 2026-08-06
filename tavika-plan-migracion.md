# Távika — Plan de migración: de envío por Gmail a plataforma de correo profesional

**Versión:** 1.0
**Fecha:** Agosto 2026
**Alcance:** Fase 1 a Fase 4 del roadmap, con las observaciones de arquitectura, riesgo de reputación, legal y unit economics integradas.

---

## 0. Resumen ejecutivo

Távika deja de enviar correos desde la cuenta Gmail personal del docente (scope `gmail.send`, inviable por el proceso de verificación de Google) y pasa a operar como **plataforma de envío profesional**: el docente redacta, Távika envía desde su propia infraestructura de correo, y las respuestas vuelven al docente vía `Reply-To`.

El cambio de modelo mueve el riesgo de reputación de "distribuido entre miles de cuentas Gmail" a "concentrado en un dominio único de Távika". Este plan asume ese riesgo como el problema central de la Fase 1, no como un detalle secundario.

**Objetivo de esta etapa:** dejar el sistema de envío en producción, con abstracción de proveedor, cola asíncrona, autenticación de dominio, rate limiting y monitoreo de reputación — antes de escalar volumen de usuarios.

---

## 1. Arquitectura general

```
┌─────────────┐      ┌─────────────┐      ┌──────────────────┐      ┌───────────────┐
│   Frontend   │─────▶│   Backend    │─────▶│  Cola de envío     │─────▶│  EmailProvider  │
│  (Next.js)   │      │  (API REST)  │      │  (jobs asíncronos) │      │  (adaptador)    │
└─────────────┘      └─────────────┘      └──────────────────┘      └───────────────┘
                             │                                              │
                             ▼                                              ▼
                      ┌─────────────┐                              ┌───────────────┐
                      │  Base de     │                              │   Proveedor     │
                      │  datos       │◀─────────webhooks────────────│   (Resend/      │
                      │  (historial) │                              │   Postmark/etc) │
                      └─────────────┘                              └───────────────┘
```

Reglas de arquitectura no negociables:

- Las API keys del proveedor de correo **nunca** se exponen al frontend. Toda la lógica de envío vive en el backend.
- Google OAuth se usa **únicamente para autenticación** (login). No se solicita ningún scope de Gmail.
- El envío de una campaña **nunca** es una llamada síncrona request→response. Siempre pasa por la cola de jobs.
- El proveedor de correo se accede exclusivamente a través de la interfaz `EmailProvider`. Ningún otro módulo del sistema debe conocer el SDK específico del proveedor.

---

## 2. Módulo `EmailProvider` (capa de abstracción)

### 2.1 Interfaz común

Todos los proveedores (Resend, Postmark, Mailgun, SES, etc.) implementan la misma interfaz. Cambiar de proveedor implica escribir un nuevo adaptador, no tocar lógica de negocio.

```python
class EmailProvider(ABC):
    @abstractmethod
    def send_email(self, to: str, from_name: str, reply_to: str,
                    subject: str, html_body: str,
                    metadata: dict) -> SendResult:
        """Envía un correo. Devuelve message_id y estado inicial."""

    @abstractmethod
    def get_status(self, message_id: str) -> EmailStatus:
        """Consulta el estado actual de un envío (delivered, bounced, etc.)."""

    @abstractmethod
    def handle_webhook(self, payload: dict) -> WebhookEvent:
        """Parsea el payload específico del proveedor a un evento normalizado."""

    @abstractmethod
    def verify_webhook_signature(self, headers: dict, body: bytes) -> bool:
        """Valida que el webhook realmente viene del proveedor."""
```

### 2.2 Modelo de eventos normalizado

Independiente del proveedor, todo webhook se traduce a uno de estos eventos internos:

- `queued` — aceptado por el proveedor
- `sent` — entregado al servidor de destino
- `delivered` — confirmado en la bandeja
- `bounced_soft` — rebote transitorio (buzón lleno, servidor caído)
- `bounced_hard` — rebote permanente (dirección inválida)
- `complaint` — marcado como spam por el destinatario
- `failed` — error interno antes de llegar al proveedor

### 2.3 Criterios de selección de proveedor (Fase 1)

Evaluar Resend, Postmark, Mailgun, Amazon SES, Brevo, SparkPost contra:

| Criterio | Peso |
|---|---|
| API REST + SDK Python | Excluyente |
| Webhooks de bounce/complaint | Excluyente |
| Soporte de Reply-To dinámico por envío | Excluyente |
| Sandbox/modo test | Excluyente |
| Precio por email a bajo volumen (arranque MVP) | Alto |
| Reputación de entregabilidad reportada | Alto |
| Facilidad de configuración de dominio (SPF/DKIM/DMARC guiado) | Medio |

**Recomendación de arranque:** Resend por DX y documentación, con la interfaz `EmailProvider` lista para migrar a Postmark si la entregabilidad a dominios institucionales (colegios con Outlook/Exchange) resulta un problema.

---

## 3. Autenticación de dominio (SPF / DKIM / DMARC)

**Prerrequisito no negociable de Fase 1**, no una tarea opcional posterior. Sin esto, la tasa de entrega real (inbox, no la que reporta el dashboard del proveedor) puede ser mala aunque el código funcione perfecto.

Tareas concretas:

1. Definir subdominio dedicado para envío, por ejemplo `mail.tavika.com.ar` (no usar el dominio raíz para no arriesgar la reputación del sitio principal/correo corporativo).
2. Configurar registros DNS: SPF, DKIM (los que provee el proveedor elegido), y DMARC con política inicial `p=none` (solo monitoreo) subiendo a `p=quarantine` una vez validado el flujo.
3. Verificar el dominio en el panel del proveedor antes de enviar el primer correo de producción.
4. Prueba de entrega real contra Gmail, Outlook/Exchange (lo más común en colegios) y al menos un webmail institucional antes de dar por cerrada la fase.

**Criterio de aceptación:** correos de prueba llegan a inbox (no a spam) en Gmail y Outlook, con SPF/DKIM/DMARC en `pass`.

---

## 4. Formato de remitente y Reply-To

Definir ahora, no dejar implícito:

- **From:** `{Nombre del docente} vía Távika <postulaciones@mail.tavika.com.ar>`
- **Reply-To:** correo real del docente (el que usó para registrarse)
- Advertencia técnica: como el dominio del Reply-To (ej. `gmail.com`) difiere del dominio del From (`mail.tavika.com.ar`), algunos filtros lo toman como señal débil. Es manejable, pero **debe probarse con destinatarios reales** antes de asumir que funciona sin fricción.

**Tarea:** enviar un lote de prueba a direcciones propias en Gmail/Outlook y confirmar que el Reply-To funciona como se espera (la respuesta llega al docente, no a Távika).

---

## 5. Cola de envío / workers

Componente explícito, no implícito en "el backend maneja el envío".

Responsabilidades:

- Encolar cada campaña como N jobs individuales (uno por destinatario), no un job monolítico.
- Respetar rate limit del proveedor **y** el rate limit propio de la plataforma (ver sección 6).
- Reintentar automáticamente errores transitorios (timeout, 5xx del proveedor) con backoff exponencial. No reintentar errores permanentes (dirección inválida).
- Actualizar el registro de historial en base de datos a medida que cada mail se procesa (no al final del lote completo).
- Consumir los webhooks del proveedor de forma asíncrona (endpoint separado, no bloqueante) y actualizar estado + disparar lógica de créditos (ej. devolución por hard bounce).

**Stack sugerido para MVP:** una cola simple (Redis + RQ/Celery si el backend es Python, o BullMQ si es Node) es suficiente. No se necesita Kafka ni infraestructura de alto volumen en esta etapa — priorizar simplicidad, como marca el documento original.

---

## 6. Rate limiting y protección de reputación de dominio

Esta es la pieza que el documento original no cubre y que priorizo en Fase 1 junto con la integración del proveedor.

### 6.1 Límites a implementar

| Nivel | Límite sugerido (ajustar con datos reales) |
|---|---|
| Por campaña | Máximo de destinatarios por campaña (ej. 200), para evitar "seleccionar los 12.000 colegios" de una sola vez |
| Por usuario / día | Tope diario agregado, independiente de créditos disponibles |
| Por plataforma / hora | Tope global de envíos por hora, alineado al límite del proveedor contratado |

### 6.2 Monitoreo de complaint rate

Métrica que falta en el documento original: no solo medir rebotes y entregados, sino **quejas de spam**, que es lo que más rápido quema reputación de dominio en Resend/Postmark/etc.

- Registrar `complaint` como evento de primera clase en el historial (sección 8).
- Definir un umbral de alerta (la industria usa ~0.1% de complaint rate como línea roja).
- Si un usuario individual genera complaints por encima de un umbral, suspender temporalmente su capacidad de enviar campañas hasta revisión manual — protege al resto de los usuarios del mismo dominio.

### 6.3 Fase futura (no ahora, dejar documentado)

Subdominios dedicados por tramo de volumen (`mail1.tavika.com.ar`, `mail2...`) para aislar el "blast radius" de un mal actor. Prematuro para el MVP, pero la arquitectura de dominio (sección 3) debería poder soportarlo sin rediseño.

---

## 7. Modelo de datos (historial + créditos)

### 7.1 Tabla `campaigns`

| Campo | Tipo |
|---|---|
| id | uuid |
| user_id | fk |
| nombre | string |
| filtros_aplicados | jsonb |
| creada_en | timestamp |
| estado | enum(borrador, enviando, completada, cancelada) |

### 7.2 Tabla `email_sends`

| Campo | Tipo |
|---|---|
| id | uuid |
| campaign_id | fk |
| user_id | fk |
| colegio_id | fk |
| estado | enum(pendiente, enviado, entregado, rebote_soft, rebote_hard, complaint, error) |
| proveedor | string |
| message_id | string |
| credito_consumido | boolean |
| enviado_en | timestamp |
| actualizado_en | timestamp |

Importante (marcado explícitamente en el documento original y reforzado acá): **guardar el resultado del envío, no solo el texto enviado.**

### 7.3 Tabla `credits`

| Campo | Tipo |
|---|---|
| id | uuid |
| user_id | fk |
| cantidad_disponible | int |
| historial_movimientos | jsonb o tabla separada `credit_transactions` |

### 7.4 Tabla `credit_transactions`

| Campo | Tipo |
|---|---|
| id | uuid |
| user_id | fk |
| tipo | enum(compra, consumo, devolucion_hard_bounce, ajuste_manual) |
| cantidad | int |
| referencia | fk a email_sends o pago Mercado Pago |
| creado_en | timestamp |

---

## 8. Lógica de créditos

Regla base (del documento original, sin cambios):

- Envío exitoso → consume 1 crédito.
- Error interno antes de intentar el envío → no consume crédito.
- Rechazo antes del envío (ej. dirección inválida detectada en validación previa) → no consume crédito.
- Hard bounce confirmado por webhook → **devolver automáticamente** el crédito.

Punto que agrego (control de abuso, impacto bajo pero vale la pena dejarlo registrado):

- Un usuario podría intentar "farmear" créditos apuntando intencionalmente a direcciones inválidas para gatillar la devolución automática. Mitigación simple para el MVP: cap de devoluciones automáticas por usuario/día, y no reembolsar si el mismo destinatario ya generó un hard bounce en un envío previo (ya se sabe que es inválido, no debería haberse podido seleccionar de nuevo — ver validación previa en sección 9).

---

## 9. Validación previa al envío

Antes de encolar un envío:

- Verificar que la dirección de destino no esté en una lista de supresión (direcciones que ya rebotaron hard o generaron complaint anteriormente en la plataforma, no solo para ese usuario — es una lista global de higiene de base de datos).
- Verificar que el usuario tenga créditos suficientes para el tamaño total de la campaña antes de empezar a encolar (evitar campañas a medio enviar por falta de crédito).
- Verificar el cap de destinatarios por campaña (sección 6.1).

---

## 10. Panel del usuario

Mostrar (según documento original, sin cambios):

- Créditos disponibles
- Campañas (con estado)
- Correos enviados / entregados / rebotados
- Historial detallado por campaña

Agregar:

- Complaint rate propio, si es relevante mostrarlo de forma transparente al usuario (opcional para MVP, útil para que el docente entienda por qué una cuenta fue limitada si llegara a pasar).

---

## 11. Unit economics — a calcular antes de fijar precios de los packs

Tarea pendiente explícita, no resuelta en el documento original. Antes de lanzar los packs de créditos (100/300/1000 envíos):

1. Costo real por email del proveedor elegido a los volúmenes esperados de arranque (no el precio de la tabla comparativa general — los tiers bajos de volumen suelen tener peor costo por unidad).
2. Comisión de Mercado Pago sobre cada compra de pack.
3. Margen objetivo.
4. Impacto estimado de devoluciones automáticas por hard bounce en el costo real (un crédito devuelto no generó costo de reenvío, pero si el usuario reintenta con la misma base sucia, sí).

**Entregable de esta tarea:** una planilla simple con el cálculo, no parte del código — sirve para fijar el precio final de los packs antes de habilitar el cobro real en producción.

---

## 12. Legal y privacidad

No resuelto todavía, solo pospuesto en la charla anterior — dejarlo como tarea explícita antes de escalar volumen, no bloqueante para empezar el desarrollo de Fase 1:

- Confirmar con alguien de legal si el uso de las direcciones de contacto institucional de los colegios (obtenidas por scraping del registro del Ministerio) cae del lado correcto de la Ley 25.326 de Protección de Datos Personales, dado que el uso es contacto laboral legítimo y no publicidad.
- Documentar una política de opt-out para colegios que no quieran recibir más postulaciones por esta vía (no solo para el docente — también para la institución receptora).
- Confirmar el estado de los Términos de Servicio del registro del Ministerio de Educación respecto al scraping (ya marcado como zona gris en auditoría anterior del portfolio/producto).

---

## 13. Roadmap con criterios de aceptación

### Fase 1 — Fundación de envío (prioridad máxima, todo esto junto, no en paralelo suelto)

- [ ] Eliminar completamente dependencia de Gmail API (refresh tokens, `gmail.send`, sincronización, renovación de tokens).
- [ ] Mantener únicamente Google OAuth para autenticación.
- [ ] Implementar interfaz `EmailProvider` + primer adaptador (Resend recomendado).
- [ ] Configurar dominio de envío con SPF/DKIM/DMARC. **Criterio de aceptación:** prueba real a Gmail y Outlook llega a inbox con autenticación en `pass`.
- [ ] Definir formato final de From/Reply-To y probarlo con destinatarios reales.
- [ ] Implementar cola de envío asíncrona (jobs individuales, reintentos, actualización incremental de historial).
- [ ] Implementar endpoint de recepción de webhooks + normalización de eventos.
- [ ] Implementar rate limiting por campaña, por usuario/día y por plataforma/hora.
- [ ] Implementar registro y monitoreo de complaint rate, con umbral de alerta y suspensión temporal automática.
- [ ] Guardar historial completo por envío (tabla `email_sends`), incluyendo resultado, no solo el texto enviado.

### Fase 2 — Créditos y cobro

- [ ] Implementar tablas `credits` y `credit_transactions`.
- [ ] Lógica de consumo/devolución de créditos (incluyendo mitigación de abuso de la sección 8).
- [ ] Integración de Mercado Pago para venta de packs (no planes PRO, según documento original).
- [ ] Panel de consumo de créditos para el usuario.
- [ ] Calcular unit economics (sección 11) antes de habilitar cobro en producción.

### Fase 3 — Métricas

- [ ] Dashboard de campaña: enviados, entregados, rebotes, errores, pendientes.
- [ ] Historial navegable por campaña y por colegio.
- [ ] Complaint rate visible internamente (equipo Távika) como métrica de salud de dominio.

### Fase 4 — Optimización (posterior, no bloqueante para lanzar)

- [ ] Subdominios dedicados por tramo de volumen, si el crecimiento lo justifica.
- [ ] Exportaciones de historial.
- [ ] Automatizaciones (ej. reenvío sugerido si no hubo respuesta en X días).
- [ ] A/B testing de plantillas de postulación.

---

## 14. Reglas que Antigravity debe respetar durante todo el desarrollo

1. No reintroducir Gmail API para envíos, bajo ninguna circunstancia.
2. Google OAuth exclusivamente como proveedor de identidad.
3. API keys del proveedor de correo nunca en el frontend.
4. Todo envío pasa por la cola, nunca es una llamada síncrona directa al proveedor desde el request del usuario.
5. Toda decisión de código debe ser compatible con el sistema de créditos, aunque créditos se implemente recién en Fase 2.
6. El acceso al proveedor de correo pasa exclusivamente por la interfaz `EmailProvider` — ningún otro módulo importa el SDK del proveedor directamente.
7. Priorizar simplicidad y bajo costo operativo para un MVP con pocos usuarios, pero sin decisiones que obliguen a reescribir la aplicación para escalar (la cola, la interfaz de proveedor y el modelo de datos ya están pensados para eso).
