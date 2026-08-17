---
title: Concepto de Gemelos Digitales en Betty
description: Entiende la correlación entre flujos de datos de hardware físico y entornos virtuales 3D.
---

Un **Gemelo Digital (*Digital Twin*)** es una representación virtual viva de un objeto, espacio o sistema físico que se actualiza a partir de datos en tiempo real.

---

## 🎭 Clasificación de Origen de Datos

Betty incorpora soporte nativo para clasificar la telemetría según su procedencia:

1. **Origen Físico (`origin_type: "sensor"`)**:
   - Lecturas reales provenientes de sensores de hardware conectados en el mundo real.
2. **Origen Virtual / Metaverso (`origin_type: "metaverso"`)**:
   - Datos emitidos desde simulaciones físicas, motores 3D, cálculos predictivos o entornos de realidad virtual/aumentada.

---

## 🔄 Flujo Bidireccional de un Gemelo Digital

```
┌─────────────────────────┐                ┌─────────────────────────┐
│     Mundo Físico        │                │     Mundo Virtual       │
│  - Sensores IoT         │── Telemetría ─►│  - Modelo 3D (Three.js) │
│  - Actuadores / Motores │◄── Comandos ───│  - Simulación y Física  │
└─────────────────────────┘                └─────────────────────────┘
```

Con Betty puedes:
- Escuchar los eventos del sensor físico vía WebSocket.
- Modificar en tiempo real la animación, posición, rotación, color o emisión lumínica del modelo 3D según los valores recibidos.
- Comparar las métricas reales del sensor contra el comportamiento esperado de la simulación.
