---
title: Sensores Físicos Compatibles
description: Lista y diagramas de conexionado para sensores populares en proyectos IoT.
---

Betty es agnóstica al hardware: cualquier sensor conectado a un microcontrolador que transmita datos en formato JSON es 100% compatible.

---

## 🌡️ Sensores de Temperatura y Humedad

### 1. BME280 (I2C)
- **Mide**: Temperatura, Humedad y Presión Atmosférica.
- **Protocolo**: I2C (`SDA` en Pin 21, `SCL` en Pin 22 en ESP32).
- **Campos JSON recomendados**:
  ```json
  {
    "temperature": 23.4,
    "humidity": 58.2,
    "pressure": 1013.25,
    "altitude": 120.5
  }
  ```

### 2. DHT11 / DHT22 (Digital)
- **Mide**: Temperatura y Humedad.
- **Protocolo**: Pin digital con resistencia pull-up de 10k.

---

## ⚡ Sensores de Movimiento y Orientación

### MPU6050 (Acelerómetro + Giroscopio 6-DOF)
- **Mide**: Aceleración (X, Y, Z) y Velocidad Angular.
- **Ideal para**: Gemelos digitales 3D en tiempo real (orientación de maquinaria, drones, robots).
- **Campos JSON**:
  ```json
  {
    "accel_x": 0.02,
    "accel_y": -0.98,
    "accel_z": 0.12,
    "gyro_x": 1.45,
    "gyro_y": -0.32,
    "gyro_z": 0.05
  }
  ```

---

## 💡 Sensores Ambientales y de Energía

- **BH1750**: Sensor de luminosidad digital en Lux.
- **PZEM-004T / INA219**: Medidores de voltaje, corriente (Amperios) y consumo eléctrico (Watts).
- **MQ-135 / MQ-2**: Calidad del aire y detección de gases/humo.
