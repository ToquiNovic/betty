---
title: Referencia de API REST
description: Especificación técnica de endpoints HTTP, autenticación y respuestas.
---

La API REST de Betty opera en el prefijo `/api` y utiliza formato JSON tanto para peticiones como para respuestas.

---

## 🔒 Autenticación

Los endpoints protegidos requieren una cabecera `Authorization` con token Bearer JWT:

```http
Authorization: Bearer <TU_ACCESS_TOKEN>
```

---

## 📦 Formato Estándar de Respuesta (`ApiResponseDto`)

Todas las respuestas de la API están envueltas en una estructura uniforme:

### Respuesta Exitosa:
```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": { ... },
  "timestamp": "2026-08-17T04:45:00.000Z"
}
```

### Respuesta de Error:
```json
{
  "success": false,
  "statusCode": 401,
  "path": "/api/sensors",
  "message": "No autorizado",
  "errors": null,
  "timestamp": "2026-08-17T04:45:00.000Z"
}
```

---

## 📋 Catálogo Principal de Endpoints

### 🔑 Autenticación (`/api/auth`)
- `POST /api/auth/register`: Registro con email, nombre y contraseña.
- `POST /api/auth/login`: Inicio de sesión (retorna accessToken y refreshToken).
- `POST /api/auth/refresh-token`: Renovación de access token.
- `POST /api/auth/forgot-password`: Solicitar correo de reseteo de contraseña.
- `POST /api/auth/reset-password`: Restablecer contraseña con token.

### 📡 Sensores (`/api/sensors`)
- `GET /api/sensors`: Listar sensores del usuario o de sus equipos.
- `POST /api/sensors`: Crear un nuevo sensor (retorna la `rawApiKey` por única vez).
- `GET /api/sensors/:id`: Obtener detalles y metadatos del sensor.
- `PATCH /api/sensors/:id`: Actualizar nombre o descripción.
- `DELETE /api/sensors/:id`: Eliminar sensor y sus registros históricos.
- `POST /api/sensors/:id/api-key/rotate`: Rotar la API Key y generar una nueva.
- `POST /api/sensors/:id/api-key/revoke`: Revocar la API Key e inactivar el sensor.
- `GET /api/sensors/:id/data`: Consultar series temporales históricas (con filtros `limit`, `from`, `to`).

### 📊 Dashboards (`/api/dashboards`)
- `GET /api/dashboards`: Listar dashboards propios y de equipos.
- `POST /api/dashboards`: Crear nuevo dashboard.
- `GET /api/dashboards/:id`: Obtener dashboard con widgets.
- `PATCH /api/dashboards/:id/publish`: Alternar visibilidad pública/privada.
- `GET /api/dashboards/public/:id`: Obtener dashboard público (sin necesidad de token).
- `POST /api/dashboards/:id/widgets`: Agregar widget (`line_chart`, `gauge`, `table`, `map`, `metric`, `bar_chart`).

### 👥 Equipos (`/api/teams`)
- `GET /api/teams`: Listar equipos a los que pertenece el usuario.
- `POST /api/teams`: Crear un nuevo equipo de trabajo.
- `POST /api/teams/join/code`: Unirse a un equipo mediante código alfanumérico de 8 caracteres.
- `POST /api/teams/join/token`: Unirse mediante enlace de invitación firmado.
- `POST /api/teams/:id/invitations/link`: Generar enlace de invitación de 7 días.

### 🧩 Proyectos Replicables (`/api/projects`)
- `GET /api/projects`: Galería pública de proyectos con filtros de dificultad y tags.
- `GET /api/projects/:id`: Detalle completo del proyecto con pasos, materiales, modelo 3D y firmwares.
- `GET /api/projects/:id/firmware/:firmwareId/manifest`: Manifest JSON para flasheo con ESP Web Tools.
