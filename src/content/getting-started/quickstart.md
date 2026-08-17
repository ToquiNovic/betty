---
title: Inicio Rápido en 5 Minutos
description: Aprende a registrar tu primer sensor y enviar telemetría a Betty en minutos.
---

En esta guía rápida conectarás tu primer dispositivo o simulación a Betty y verás los datos reflejados en tiempo real.

---

## 📋 Requisitos Previos

- Tener acceso a la plataforma Betty (ej: `http://localhost:3001` en local).
- Cliente MQTT (como `mosquitto_pub`, un script en Python o un microcontrolador ESP32).

---

## 🚀 Paso 1: Crea tu Cuenta y Registra un Sensor

1. Inicia sesión en la consola de Betty.
2. Ve a la sección **Sensores** y haz clic en **+ Nuevo Sensor**.
3. Ingresa un nombre (ej. `Sensor Laboratorio 1`) y selecciona el tipo de origen:
   - **Físico (Sensor)**: Para placas de hardware reales (ESP32, Arduino, Raspberry Pi).
   - **Metaverso / Simulación**: Para entornos virtuales o simuladores 3D.
4. Al guardar, Betty generará una **API Key criptográfica** con el formato:
   ```bash
   betty_live_a1b2c3d4e5f6...
   ```
   > ⚠️ **IMPORTANTE**: Copia y guarda tu API Key de inmediato. Por motivos de seguridad, nunca se volverá a mostrar en texto plano.

---

## 📡 Paso 2: Publica Datos vía MQTT

El broker EMQX escucha por defecto en el puerto `1883`.

### Parámetros de Conexión:
- **Broker Host**: `localhost` (o la IP/dominio de tu servidor)
- **Puerto**: `1883` (TCP)
- **Usuario (`Username`)**: El ID del sensor (UUID, ej. `4c40ea57-43e0-4ee2-a8d5-77aae4fc387b`)
- **Contraseña (`Password`)**: Tu API Key completa (`betty_live_...`)
- **Tópico MQTT**:
  ```
  betty/sensor/<sensorId>/data
  ```

### Ejemplo con `mosquitto_pub`:

```bash
mosquitto_pub \
  -h localhost \
  -p 1883 \
  -u "4c40ea57-43e0-4ee2-a8d5-77aae4fc387b" \
  -P "betty_live_xxxxxxxxxxxxxxxxxxxxxxxx" \
  -t "betty/sensor/4c40ea57-43e0-4ee2-a8d5-77aae4fc387b/data" \
  -m '{"temperature": 24.5, "humidity": 60.2, "origin_type": "sensor"}'
```

---

## 📊 Paso 3: Visualiza los Datos en Vivo

1. Abre el sensor en la consola web de Betty.
2. Observarás cómo la gráfica temporal y la tabla de lecturas se actualizan automáticamente en tiempo real mediante WebSockets.
3. Puedes añadir este sensor a cualquier **Dashboard** con widgets de aguja (*gauge*), series temporales (*line chart*) o métricas KPI.
