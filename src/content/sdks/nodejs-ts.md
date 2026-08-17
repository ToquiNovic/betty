---
title: Cliente Node.js / TypeScript
description: Ejemplo de integración y publicación de telemetría con Node.js y TypeScript.
---

Puedes interactuar con Betty en tus aplicaciones de servidor o microservicios usando librerías estándar como `mqtt` y `socket.io-client`.

---

## 📦 Instalación

```bash
npm install mqtt socket.io-client
```

---

## 📡 Ejemplo de Publicador MQTT en Node.js

```typescript
import mqtt from 'mqtt';

const SENSOR_ID = '4c40ea57-43e0-4ee2-a8d5-77aae4fc387b';
const API_KEY = 'betty_live_xxxxxxxxxxxxxxxxxxxxxxxx';
const BROKER_URL = 'mqtt://localhost:1883';

const client = mqtt.connect(BROKER_URL, {
  username: SENSOR_ID,
  password: API_KEY,
  clientId: `node_client_${Date.now()}`,
});

client.on('connect', () => {
  console.log('✅ Conectado a Betty MQTT Broker');

  // Enviar telemetría periódica
  setInterval(() => {
    const payload = {
      cpu_usage: Math.round(Math.random() * 100),
      memory_free_mb: 2048 + Math.round(Math.random() * 500),
      requests_per_sec: 142,
      origin_type: 'sensor',
    };

    const topic = `betty/sensor/${SENSOR_ID}/data`;
    client.publish(topic, JSON.stringify(payload), { qos: 1 }, (err) => {
      if (err) console.error('Error publicando:', err);
      else console.log('📤 Telemetría enviada:', payload);
    });
  }, 3000);
});

client.on('error', (err) => {
  console.error('❌ Error de conexión MQTT:', err);
});
```
