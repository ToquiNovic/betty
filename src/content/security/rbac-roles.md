---
title: Roles y Permisos (RBAC)
description: Sistema unificado de control de acceso basado en roles para la plataforma y equipos.
---

Betty implementa un modelo de **Control de Acceso Basado en Roles (RBAC)** relacional unificado en la tabla `roles` con dos ámbitos (*scopes*):

---

## 🏛️ 1. Roles del Sistema (`scope: system`)

Asignados globalmente a cada usuario de la plataforma en `users.role_id`:

| Rol | Slug | Permisos | Descripción |
| :--- | :--- | :--- | :--- |
| **Administrador** | `admin` | `["*"]` | Control total del sistema, administración de usuarios, auditoría global y creación de proyectos replicables. |
| **Usuario Estándar** | `user` | `["team:create", "sensor:create", "dashboard:create"]` | Creación de sensores propios, tableros y equipos. |

---

## 👥 2. Roles de Equipo (`scope: team`)

Asignados a los miembros dentro de un equipo en `team_members.role_id`:

| Rol | Slug | Permisos JSONB | Capacidades |
| :--- | :--- | :--- | :--- |
| **Propietario (*Owner*)** | `owner` | `["team:*", "sensor:*", "dashboard:*", "member:*"]` | Máxima autoridad del equipo, puede eliminar el equipo, transferir propiedad y expulsar miembros. |
| **Administrador de Equipo** | `team_admin` | `["team:read", "sensor:*", "dashboard:*", "member:invite", "member:remove"]` | Administra dispositivos y dashboards compartidos e invita a nuevos miembros. |
| **Miembro** | `member` | `["team:read", "sensor:read", "sensor:data", "dashboard:create", "dashboard:read"]` | Puede ver sensores, crear dashboards y consultar telemetría. |
| **Observador (*Viewer*)** | `viewer` | `["team:read", "sensor:read", "dashboard:read"]` | Acceso de solo lectura a los tableros del equipo. |
