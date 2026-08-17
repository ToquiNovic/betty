---
title: WebSocket Gateway en Tiempo Real
description: Conexión bidireccional y suscripciones en tiempo real con Socket.IO.
---

Betty expone un Gateway WebSocket basado en **Socket.IO** en la ruta `/realtime`, permitiendo a dashboards, gemelos digitales 3D y aplicaciones móviles recibir lecturas instantáneamente en cuanto se publican vía MQTT.

---

## 🔌 Endpoint de Conexión

```
ws://<TU_DOMINIO_O_IP>:3000/realtime
```

---

## 📡 Eventos y Suscripciones

Para optimizar el ancho de banda, el gateway utiliza **salas (*rooms*)** por sensor y tablero.

### 1. Suscribirse a un Sensor

Envía el evento `subscribe:sensor` con el ID del sensor:

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/realtime', {
  transports: ['websocket'],
  auth: {
    token: 'TU_JWT_BEARER_TOKEN_AQUI' // Opcional para dashboards públicos
  }
});

socket.on('connect', () => {
  console.log('Conectado al Gateway de Betty');
  
  // Suscribirse a la sala del sensor
  socket.emit('subscribe:sensor', { sensorId: '4c40ea57-43e0-4ee2-a8d5-77aae4fc387b' });
});

// Escuchar datos en vivo
socket.on('sensor:data', (data) => {
  console.log('Nueva lectura recibida:', data);
  // data = { id, sensorId, payload: { temperature: 24.5, ... }, originType: 'sensor', recordedAt: '...' }
});
```

### 2. Desuscribirse

```javascript
socket.emit('unsubscribe:sensor', { sensorId: '4c40ea57-43e0-4ee2-a8d5-77aae4fc387b' });
```

---

## 🌐 Suscripción a Tableros (Dashboards)

Si tienes un dashboard con múltiples widgets, puedes suscribirte a todos los sensores del tablero en un solo comando:

```javascript
socket.emit('subscribe:dashboard', { dashboardId: 'uuid-del-dashboard' });
```
