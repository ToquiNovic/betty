---
title: Introduction to Betty
description: Architectural overview of Betty open source platform for IoT and Digital Twins.
---

**Betty** is an open-source IoT Application Enablement Platform (AEP) engineered for high-throughput telemetry ingestion, time-series storage, real-time visual dashboards, and native digital twin metaverse synchronization.

---

## 🎯 Why Betty?

- **Extreme Ingestion Throughput**: Powered by **EMQX 5.8** MQTT broker with per-sensor HTTP cryptographic auth.
- **Fast Analytical Time-Series**: **PostgreSQL 16 + TimescaleDB** hypertables with automatic temporal partitioning.
- **Multi-Threaded In-Memory Bus**: **Dragonfly** (Redis-compatible) for ultra-low latency Pub/Sub and caching.
- **Dual Role RBAC**: System roles (`admin`, `user`) and Workspace/Team roles (`owner`, `team_admin`, `member`, `viewer`).
- **Browser-Based USB Flashing**: Upload firmware binaries `.bin` and flash ESP32/ESP8266 devices directly through the Web Serial API with interactive 3D model viewers.
