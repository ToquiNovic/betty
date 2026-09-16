---
title: Ingesta MQTT (EMQX)
description: Protocolo de mensajería para sensores IoT y transmisiones de telemetría.
---

El protocolo MQTT es el estándar principal para enviar telemetría de dispositivos hacia Betty.

---

## 🔐 Autenticación MQTT

Betty implementa autenticación HTTP delegada en el broker EMQX. Cada conexión debe autenticarse con las siguientes credenciales:

- **Username**: El UUID del sensor registrado (ej: `4c40ea57-43e0-4ee2-a8d5-77aae4fc387b`).
- **Password**: La API Key criptográfica completa (ej: `betty_live_1234567890abcdef...`).
- **Client ID**: Cualquier identificador único o el mismo UUID del sensor.

---

## 📬 Formato del Tópico MQTT

Los sensores solo tienen permiso para publicar en su propio tópico dedicado:

```
betty/sensor/<SENSOR_UUID>/data
```

> 💡 **Nota**: Intentar publicar en el tópico de otro sensor o sin credenciales válidas resultará en la desconexión inmediata por parte de EMQX.

---

## 📦 Estructura del Payload JSON

El payload publicado debe ser un objeto JSON válido. Betty extrae y almacena todos los campos numéricos y de texto automáticamente.

### Ejemplo de Payload Básico:

```json
{
  "temperature": 23.8,
  "humidity": 55.4,
  "pressure": 1013.25,
  "battery_voltage": 3.72,
  "origin_type": "sensor"
}
```

### Campos Especiales:

| Campo | Tipo | Requerido | Descripción |
| :--- | :--- | :--- | :--- |
| `origin_type` | `string` | No (default: `"sensor"`) | Clasifica el dato como `"sensor"` (dispositivo físico) o `"metaverso"` (simulación virtual). |
| `recorded_at` | `string (ISO 8601)` | No (default: `now()`) | Timestamp explícito de la lectura si el dispositivo almacena datos sin conexión y los sincroniza después. |

---

## ⚡ Niveles de QoS Recomendados

- **QoS 0 (At most once)**: Para sensores de alta frecuencia (ej: acelerómetros o telemetría continua de posición).
- **QoS 1 (At least once)**: Recomendado para mediciones periódicas estándar (temperatura, energía, alarmas).
