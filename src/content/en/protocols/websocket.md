---
title: Real-Time WebSocket Gateway
description: Low-latency bidirectional subscriptions using Socket.IO.
---

Connect to `ws://<HOST>:3000/realtime` and join rooms per sensor:

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/realtime', {
  transports: ['websocket'],
});

socket.on('connect', () => {
  socket.emit('subscribe:sensor', { sensorId: '4c40ea57-43e0-4ee2-a8d5-77aae4fc387b' });
});

socket.on('sensor:data', (data) => {
  console.log('Telemetry received:', data);
});
```
