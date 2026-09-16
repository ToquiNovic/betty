---
title: Gestión Segura de API Keys
description: Cómo se generan, hashean y auditan las claves criptográficas en Betty.
---

La seguridad en la ingesta de telemetría es fundamental en Betty. Las API Keys autentican a cada dispositivo físico o virtual de forma individual.

---

## 🔒 Arquitectura Criptográfica

1. **Generación**: Cada clave se crea utilizando generadores de entropía criptográfica (`CryptoUtil.generateApiKey()`), produciendo una clave con el prefijo `betty_live_` y 32 bytes de alta entropía.
2. **Hasheo Inmutable**: Betty calcula el hash **SHA-256** de la clave y almacena únicamente `api_key_hash` y los primeros 12 caracteres visibles como `api_key_prefix` en la tabla `sensors`.
3. **Cero Texto Plano**: La clave en texto plano (`rawApiKey`) **NUNCA** se guarda en la base de datos ni se escribe en logs. Se entrega una sola vez al usuario al momento de la creación.
4. **Validación Instantánea**: Al recibir la conexión MQTT, Betty calcula el SHA-256 de la contraseña proporcionada y la compara en tiempo constante contra el hash almacenado.

---

## 🔄 Rotación y Revocación

- **Rotación**: En caso de sospecha de compromiso, puedes pulsar **"Rotar API Key"** desde la consola web. La clave antigua queda invalidada de inmediato y se entrega una nueva.
- **Revocación**: Inactiva el sensor y rechaza cualquier paquete MQTT entrante de forma permanente.
- **Auditoría**: Toda creación, rotación y revocación queda registrada en `api_key_audit_log`.
