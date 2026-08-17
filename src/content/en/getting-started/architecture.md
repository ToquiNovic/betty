---
title: System Architecture
description: Internal data flow, hexagonal architecture, and infrastructure components of Betty.
---

Betty is architected with **Clean Architecture (Hexagonal)** principles to deliver high concurrency, strict isolation, and sub-millisecond Pub/Sub delivery.

---

## 🏗️ Architecture Stack

1. **EMQX 5.8 (MQTT Broker)**: Ingests telemetry via TCP (1883), WSS (8084), and authenticated HTTP webhooks.
2. **Betty API (NestJS 11)**: Validates payloads, coordinates persistence, and manages role permissions.
3. **TimescaleDB (PostgreSQL 16)**: Time-series hypertables with temporal partitioning for high-speed queries.
4. **Dragonfly**: Ultra-fast in-memory cache and multithreaded Pub/Sub broker.
5. **Realtime Gateway (Socket.IO)**: Bridges Dragonfly Pub/Sub channels to browser dashboards with low latency.
