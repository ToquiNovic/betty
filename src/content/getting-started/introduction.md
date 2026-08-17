---
title: Introducción a Betty PaaS
description: Visión general de Betty, la plataforma abierta de IoT y Gemelos Digitales.
---

**Betty PaaS** es una plataforma como servicio (PaaS) de código abierto diseñada para la ingesta de telemetría de alto rendimiento, el procesamiento de series temporales y la sincronización en tiempo real con entornos virtuales, gemelos digitales y metaversos.

---

## 🎯 ¿Por qué Betty?

El desarrollo de soluciones IoT tradicionales a menudo enfrenta desafíos complejos:
- Servidores que no escalan ante ráfagas de datos MQTT.
- Bases de datos relacionales lentas para consultas sobre millones de registros históricos.
- Desconexión entre los dispositivos físicos de hardware y los modelos virtuales de simulación 3D.
- Dificultad para que los usuarios finales carguen firmware sin instalar cadenas de herramientas complejas en su ordenador.

Betty resuelve estos problemas unificando:
1. **Ingesta Ultrarrápida**: Broker MQTT (**EMQX**) con autenticación criptográfica vía HTTP.
2. **Persistencia Optimizada**: **PostgreSQL 16 + TimescaleDB** con hypertables particionadas por tiempo.
3. **Caché y Mensajería Multihilo**: **Dragonfly** (compatible con Redis) para Pub/Sub y caché de consultas.
4. **Visualización y Colaboración**: Dashboards configurables en tiempo real con WebSockets y soporte de equipos con roles RBAC (`owner`, `team_admin`, `member`, `viewer`).
5. **Instalación Web USB**: Carga de firmware binario directamente desde el navegador mediante la API Web Serial y visualizador de modelos 3D interactivos (.glb/.stl).

---

## 👥 Casos de Uso

- **Monitoreo Industrial y Ambiental**: Registro continuo de sensores de temperatura, humedad, calidad de aire, vibración y presión.
- **Gemelos Digitales Universitarios y Empresariales**: Réplicas virtuales 3D de laboratorios, edificios inteligentes o maquinaria en Three.js o Unity.
- **Proyectos de Hardware DIY & Makers**: Publicación de proyectos de electrónica guiados paso a paso con piezas imprimibles en 3D y flasheo de firmware con un solo clic.
- **Simulaciones de Metaverso**: Ingesta de telemetría generada desde simulaciones en tiempo real clasificada como origen `metaverso`.
