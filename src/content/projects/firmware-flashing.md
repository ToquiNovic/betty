---
title: Flasheo de Firmware por Web Serial (USB)
description: Cómo funciona la instalación de firmware directa desde el navegador sin instalar herramientas locales.
---

Betty integra la **Web Serial API** y la librería `esptool-js` para permitir a los usuarios programar sus placas ESP32 y ESP8266 conectándolas directamente por cable USB a su ordenador.

---

## 🧭 ¿Cómo Funciona el Proceso?

```
[Navegador Web (Chromium)] ─── Web Serial API (USB) ───► [Microcontrolador ESP32]
           │
           │ HTTP GET /api/files/firmware/...
           ▼
[Betty API Server (Almacenamiento Local)]
```

1. El usuario conecta su placa ESP32 por USB y hace clic en **"Flashear Firmware"**.
2. El navegador solicita permiso para acceder al puerto COM serie mediante `navigator.serial.requestPort()`.
3. Betty establece conexión con el bootloader del ESP a una velocidad de **921600 baudios**.
4. Se detecta el modelo exacto de chip (ej: `ESP32-D0WD-V3`).
5. Se descarga el archivo `.bin` compilado desde el servidor de Betty y se escribe en la dirección de memoria especificada (por defecto `0x10000`).
6. El microcontrolador se reinicia automáticamente y comienza a ejecutar el firmware.

---

## 🛠️ Cómo Compilar y Subir Firmware como Administrador

1. En Arduino IDE o PlatformIO, compila tu sketch y exporta los binarios compilados (`.bin`).
2. Entra a la consola de administración en `/admin/projects/:id/edit`.
3. Ve a la pestaña **Firmware** y haz clic en **+ Subir Nuevo Firmware**.
4. Selecciona la familia del chip (`ESP32`, `ESP8266`, etc.), la versión semver (ej: `1.0.0`) y el offset de memoria (`0x10000`).
5. Sube el archivo `.bin`. El binario quedará almacenado localmente en el servidor (`uploads/firmware/`) listo para flashear.
