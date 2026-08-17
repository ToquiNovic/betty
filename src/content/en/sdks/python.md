---
title: Python Client
description: Streaming telemetry from Python applications with paho-mqtt.
---

```python
import paho.mqtt.client as mqtt
import json, time

client = mqtt.Client(client_id="python_client")
client.username_pw_set(username="YOUR_SENSOR_UUID", password="betty_live_...")
client.connect("localhost", 1883)

client.publish("betty/sensor/YOUR_SENSOR_UUID/data", json.dumps({
    "temperature": 23.4,
    "humidity": 61.2,
    "origin_type": "sensor"
}))
```
