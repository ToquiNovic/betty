---
title: Quickstart in 5 Minutes
description: Register your first sensor and transmit live telemetry to Botuto.
---

Connect your physical hardware device or simulation to Botuto and watch data stream in real-time.

---

## 🚀 Step 1: Register a Sensor

1. Log into your Botuto web dashboard.
2. Navigate to **Sensors** and click **+ New Sensor**.
3. Provide a name and choose the origin type (`Physical Sensor` or `Metaverse / Simulation`).
4. Copy the generated **cryptographic API Key** (`botuto_live_...`) immediately.

---

## 📡 Step 2: Publish via MQTT

- **Broker**: `localhost:1883`
- **Username**: Sensor UUID (e.g., `4c40ea57-43e0-4ee2-a8d5-77aae4fc387b`)
- **Password**: API Key (`botuto_live_...`)
- **Topic**: `botuto/sensor/<sensorId>/data`

### Using `mosquitto_pub`:

```bash
mosquitto_pub \
  -h localhost \
  -p 1883 \
  -u "4c40ea57-43e0-4ee2-a8d5-77aae4fc387b" \
  -P "botuto_live_xxxxxxxxxxxxxxxxxxxxxxxx" \
  -t "botuto/sensor/4c40ea57-43e0-4ee2-a8d5-77aae4fc387b/data" \
  -m '{"temperature": 24.5, "humidity": 60.2, "origin_type": "sensor"}'
```
