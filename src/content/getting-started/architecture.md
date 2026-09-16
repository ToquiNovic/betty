---
title: Arquitectura del Sistema
description: Conoce los componentes centrales, flujo de datos y modelo de capas de Betty IoT Platform.
---

Betty está construida siguiendo principios de **Clean Architecture (Arquitectura Hexagonal)** y microservicios modulares para garantizar alta disponibilidad y throughput masivo.

---

## 🏛️ Diagrama de Flujo de Ingesta y Tiempo Real

```
[Dispositivo Físico / ESP32]          [Simulación 3D / Metaverso]
            │                                     │
            └───────────────┬─────────────────────┘
                            │ MQTT Publish (betty/sensor/:id/data)
                            ▼
                    ┌───────────────┐
                    │    EMQX 5.8   │◄── HTTP Auth (POST /api/mqtt/auth)
                    │  MQTT Broker  │
                    └───────┬───────┘
                            │ Webhook HTTP (POST /api/mqtt/webhook)
                            ▼
                    ┌───────────────┐
                    │   Betty API   │ (NestJS)
                    └───────┬───────┘
            ┌───────────────┴───────────────┐
            ▼                               ▼
    ┌───────────────┐               ┌───────────────┐
    │  PostgreSQL   │               │   Dragonfly   │
    │  TimescaleDB  │               │ Cache/PubSub  │
    └───────────────┘               └───────┬───────┘
                                            │ Pub/Sub Channel
                                            ▼
                                    ┌───────────────┐
                                    │ Socket.IO WSS │
                                    │    Gateway    │
                                    └───────┬───────┘
                                            │ Real-time Push
                                            ▼
                                    [Cliente Web / Dashboards]
```

---

## 🧩 Componentes de la Infraestructura

### 1. Ingesta de Datos: EMQX Broker (5.8)
- Broker MQTT escalable capaz de gestionar millones de conexiones concurrentes.
- Cuando un dispositivo se conecta, EMQX consulta a `betty-api` mediante HTTP webhook (`POST /api/mqtt/auth`) verificando el ID del sensor y el hash de la API Key.
- Al recibir un mensaje en `betty/sensor/:id/data`, EMQX reenvía el payload a `betty-api` vía `POST /api/mqtt/webhook`.

### 2. Capa de Negocio: Betty API (NestJS)
- Procesa el payload JSON, valida los tipos y persiste la lectura en la base de datos.
- Invalida la caché de lecturas recientes del sensor en Dragonfly.
- Publica el evento en el canal interno `sensor:<id>:data`.

### 3. Persistencia de Series Temporales: TimescaleDB + PostgreSQL 16
- Utiliza **Hypertables** particionadas automáticamente por tiempo (`recorded_at`).
- Permite agregaciones hiper-rápidas sobre miles de millones de filas históricas con Drizzle ORM.

### 4. Caché y Bus de Mensajería: Dragonfly
- Servidor en memoria compatible con Redis pero con arquitectura multihilo.
- Maneja el sistema Pub/Sub que comunica el proceso de ingesta con el Gateway de WebSockets.

### 5. Distribución en Tiempo Real: Socket.IO Gateway
- Los clientes web suscritos a la sala `sensor:<id>` reciben la actualización inmediatamente con latencia menor a 15ms.
