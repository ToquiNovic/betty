---
title: Node.js / TypeScript Client
description: Connecting Node.js applications to Betty via MQTT and WebSockets.
---

```typescript
import mqtt from 'mqtt';

const client = mqtt.connect('mqtt://localhost:1883', {
  username: 'YOUR_SENSOR_UUID',
  password: 'betty_live_...',
});

client.on('connect', () => {
  console.log('Connected to Betty MQTT');
  client.publish('betty/sensor/YOUR_SENSOR_UUID/data', JSON.stringify({
    temperature: 24.5,
    humidity: 55.0,
    origin_type: 'sensor'
  }));
});
```
