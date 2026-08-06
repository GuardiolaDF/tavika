
# Távika — Especificación Técnica del Producto (MVP)

> **Versión:** 2.0  
> **Estado:** Documento maestro del proyecto  
> **Objetivo:** Definir la arquitectura, reglas de negocio y roadmap del MVP sin introducir complejidad innecesaria.

## 0. Visión

Távika es una plataforma que ayuda a docentes a postularse a instituciones educativas mediante campañas de correo personalizadas.

La plataforma **no envía correos desde la cuenta Gmail del usuario**. Google OAuth queda exclusivamente para autenticación. El envío se realiza mediante un proveedor transaccional (Resend inicialmente) utilizando la infraestructura de Távika.

El objetivo del MVP es validar el producto con pocos usuarios, bajo costo operativo y una arquitectura que pueda crecer sin reescribirse.

---

## Principios del proyecto

- Priorizar simplicidad.
- No implementar infraestructura antes de necesitarla.
- Mantener independencia del proveedor de correo.
- Toda API Key permanece exclusivamente en el backend.
- Todo el sistema debe poder migrar de proveedor sin modificar la lógica de negocio.
- Nunca ofrecer envíos ilimitados.

---

## Modelo de negocio

El usuario compra paquetes de créditos.

1 crédito = 1 intento de envío.

Los créditos permiten controlar costos y escalar sin modificar el modelo comercial.

Los rebotes permanentes (hard bounce) devuelven automáticamente el crédito.

---

## Arquitectura MVP

Frontend (Next.js)

↓

Backend (FastAPI)

↓

EmailProvider

↓

Proveedor (Resend)

↓

Webhooks

↓

Base de datos

No se implementarán Redis, Celery, Kafka ni microservicios durante el MVP.

El backend enviará inicialmente de forma simple. La arquitectura deberá permitir incorporar una cola en el futuro sin romper compatibilidad.

---

## EmailProvider

Toda integración debe implementarse mediante una interfaz común.

Proveedor inicial:

- Resend

Requisitos:

- Reply-To
- Webhooks
- SDK Python
- API REST
- Métricas
- Bounce
- Sandbox

Nunca depender del SDK directamente desde la lógica de negocio.

---

## Dominio

Subdominio dedicado:

mail.tavika.com.ar

Configurar:

- SPF
- DKIM
- DMARC

Google OAuth únicamente para Login.

---

## Créditos

Consumir:

- envío aceptado → -1 crédito

Reintegrar:

- hard bounce confirmado

No reintegrar:

- spam
- complaint
- errores del usuario

---

## Panel del usuario

Mostrar:

- créditos
- campañas
- enviados
- entregados
- rebotes
- respuestas esperadas
- historial

---

## Roadmap

### MVP

- Login Google
- Resend
- Créditos
- Mercado Pago
- Historial
- Webhooks
- Reply-To
- Dashboard
- Deploy

### Versión 1

- Métricas avanzadas
- Optimización de entregabilidad
- Exportaciones

### Futuro

- Cola distribuida
- Workers
- Subdominios
- A/B testing
- Automatizaciones

---

## No implementar en el MVP

- Celery
- Redis
- Kafka
- Microservicios
- IA para escribir mails
- Planes ilimitados
- Balanceo
- Infraestructura distribuida

---

## Reglas para Antigravity

1. No volver a introducir Gmail API para envíos.
2. OAuth únicamente para autenticación.
3. Todo envío debe pasar por EmailProvider.
4. No agregar complejidad que no resuelva un problema actual.
5. Mantener compatibilidad con un futuro sistema de colas.
6. Optimizar únicamente cuando existan métricas que lo justifiquen.
