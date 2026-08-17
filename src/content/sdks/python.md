---
title: Cliente Python
description: Script de publicación de datos y consumo de telemetría con Python.
---

Python es perfecto para scripts de ciencia de datos, Raspberry Pi y prototipado rápido con Betty.

---

## 📦 Instalación

```bash
pip install paho-mqtt requests python-socketio[client]
```

---

## 🐍 Ejemplo con `paho-mqtt`

```python
import paho.mqtt.client as mqtt
import json
import time
import random

SENSOR_ID = "4c40ea57-43e0-4ee2-a8d5-77aae4fc387b"
API_KEY = "betty_live_xxxxxxxxxxxxxxxxxxxxxxxx"
BROKER_HOST = "localhost"
BROKER_PORT = 1883

TOPIC = f"betty/sensor/{SENSOR_ID}/data"

def on_connect(client, userdata, flags, rc):
    if rc == 0:
        print("✅ Conectado exitosamente a Betty MQTT")
    else:
        print(f"❌ Error al conectar, código de retorno: {rc}")

client = mqtt.Client(client_id=f"python_node_{int(time.time())}")
client.username_pw_set(username=SENSOR_ID, password=API_KEY)
client.on_connect = on_connect

client.connect(BROKER_HOST, BROKER_PORT, keepalive=60)
client.loop_start()

try:
    while True:
        payload = {
            "temperature": round(20.0 + random.uniform(0, 10), 2),
            "humidity": round(45.0 + random.uniform(0, 20), 2),
            "co2_ppm": random.randint(400, 1200),
            "origin_type": "sensor"
        }
        
        client.publish(TOPIC, json.dumps(payload), qos=1)
        print(f"📤 Datos enviados: {payload}")
        time.sleep(5)
except KeyboardInterrupt:
    print("\nDeteniendo cliente...")
finally:
    client.loop_stop()
    client.disconnect()
```
