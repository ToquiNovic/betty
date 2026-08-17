---
title: Proyectos Replicables en Betty
description: Guía para crear y publicar proyectos guiados con modelos 3D y firmware instalable.
---

El módulo de **Proyectos Replicables** permite a los administradores documentar proyectos IoT completos para que la comunidad o los miembros del equipo puedan ensamblarlos sin fricción.

---

## 📋 Estructura de un Proyecto Replicable

Cada proyecto incluye:

1. **Información General**: Título, descripción, nivel de dificultad (`beginner`, `intermediate`, `advanced`), microcontrolador requerido (ej: `ESP32`) y foto de portada.
2. **Pasos Guiados (*Steps*)**: Pasos de ensamblaje ordenados cronológicamente con explicaciones detalladas en Markdown, fotos ilustrativas y enlaces a video opcionales.
3. **Lista de Materiales (*BOM*)**: Componentes necesarios, cantidades, costos estimados y enlaces directos de compra.
4. **Modelo 3D Interactivo**: Archivo `.glb`, `.gltf` o `.stl` de la carcasa o circuito renderizable en 3D en el navegador.
5. **Firmware USB**: Binario compilado `.bin` alojado en el servidor para que los usuarios puedan flashearlo directamente por USB con un solo clic.
