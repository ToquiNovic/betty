---
title: MQTT Ingestion (EMQX)
description: Messaging protocol specifications for hardware devices and simulations.
---

## 🔐 Credentials

- **Username**: Sensor UUID (e.g., `4c40ea57-43e0-4ee2-a8d5-77aae4fc387b`)
- **Password**: Full cryptographic API Key (`botuto_live_...`)
- **Topic**: `botuto/sensor/<SENSOR_UUID>/data`

---

## 📦 JSON Payload Specification

```json
{
  "temperature": 23.8,
  "humidity": 55.4,
  "pressure": 1013.25,
  "origin_type": "sensor"
}
```
