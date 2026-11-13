---
title: Node.js / TypeScript Client
description: Connecting Node.js applications to Botuto via MQTT and WebSockets.
---

```typescript
import mqtt from 'mqtt';

const client = mqtt.connect('mqtt://botuto.laboratorio3d.online:1883', {
  username: 'YOUR_SENSOR_UUID',
  password: 'botuto_live_...',
});

client.on('connect', () => {
  console.log('Connected to Botuto MQTT');
  client.publish('botuto/sensor/YOUR_SENSOR_UUID/data', JSON.stringify({
    temperature: 24.5,
    humidity: 55.0,
    origin_type: 'sensor'
  }));
});
```
