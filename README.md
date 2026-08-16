# ⚡ Betty Client — Frontend PaaS para IoT, Gemelos Digitales y Metaversos

<p align="center">
  <strong>Frontend moderno de alto rendimiento para visualización de telemetría en tiempo real, gestión de dispositivos, tableros interactivos y gemelos digitales.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.3-black?logo=next.js&logoColor=white" alt="Next.js 16" />
  <img src="https://img.shields.io/badge/React-19.2-61DAFB?logo=react&logoColor=black" alt="React 19" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC?logo=tailwind-css&logoColor=white" alt="Tailwind CSS v4" />
  <img src="https://img.shields.io/badge/Base_UI-1.7-111?logo=baseui&logoColor=white" alt="Base UI" />
  <img src="https://img.shields.io/badge/Socket.IO-4.8-010101?logo=socket.io&logoColor=white" alt="Socket.IO" />
  <img src="https://img.shields.io/badge/SWR-2.5-black?logo=swr&logoColor=white" alt="SWR" />
  <img src="https://img.shields.io/badge/License-MIT-green" alt="MIT License" />
</p>

---

## 🌟 Características Principales

- 📡 **Streaming de Telemetría en Tiempo Real**: Conexión bidireccional continua vía WebSocket con **Socket.IO** sincronizado con el broker **EMQX** y el Pub/Sub de **Dragonfly**.
- 📊 **Dashboards Dinámicos e Interactivos**: Creación de tableros personalizables con cuadrículas ajustables y 6 tipos de widgets modulares:
  - 📈 **Gráfico de Área / Líneas (`line_chart`)**: Curvas suaves con degradados de transparencia, tooltips estilizados y rango temporal.
  - ⏱️ **Medidor de Rango (`gauge`)**: Visualización por umbrales de color dinámicos (Esmeralda, Ámbar, Rosa).
  - 🔢 **Métrica / KPI (`metric`)**: Indicador de precisión con clasificación de origen (`sensor` vs `metaverso`) y hora exacta de registro.
  - 📊 **Gráfico de Barras (`bar_chart`)**: Comparativa visual de métricas.
  - 🗺️ **Mapa Geográfico (`map`)**: Posicionamiento geoespacial de dispositivos vía Leaflet con renderizado dinámico SSR-safe.
  - 📋 **Tabla de Datos (`table`)**: Histórico tabular de lecturas de telemetría.
- 🌐 **Explorador de Tableros Públicos (`/explore`)**: Visualización de tableros compartidos públicamente sin requerir inicio de sesión.
- 👥 **Gestión de Equipos y Membresías**: Administración colaborativa de dispositivos, roles de equipo (`owner`, `team_admin`, `member`, `viewer`), códigos de acceso y enlaces de invitación de 7 días.
- 🔑 **Gestión Criptográfica de Sensores**: Creación y rotación de API Keys (`betty_live_...`), temas MQTT asignados y copiado rápido de credenciales.
- 🌓 **Tema Dual (Dark & Light Mode)**: Paleta OKLCH optimizada para telemetría cibernética con `next-themes`.
- 🌍 **Internacionalización (i18n)**: Soporte completo de idiomas (Español e Inglés) gestionado con `next-intl`.
- 🔔 **Notificaciones Fluidas con Sileo**: Toasts basados en física de resortes y morphing SVG (*reemplazando a Sonner*), integrados con el tema OKLCH (`src/lib/toast.ts`).
- ⚡ **React 19 & Next.js 16 Clean Architecture**: Adhesión total a las buenas prácticas de React 19 (sin efectos en cascada, suscripciones seguras con `useSyncExternalStore`, claves deterministas y soporte para React Compiler).

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Descripción |
|:---|:---|:---|
| **Framework** | Next.js 16.3.1 (App Router + Turbopack) | Server Components, enrutamiento dinámico y generación estática |
| **Biblioteca UI** | React 19.2.8 | Primitivas reactivas modernas y renderizado concurrente |
| **Estilos** | Tailwind CSS v4 + `@tailwindcss/postcss` | Motor de estilos de última generación con variables OKLCH |
| **Componentes Base** | `@base-ui/react` + Shadcn UI | Componentes accesibles, desacoplados y estilizados |
| **Data Fetching** | SWR 2.5 + Axios / Fetch nativo | Revalidación inteligente de caché en cliente |
| **Realtime** | Socket.IO Client 4.8 | Suscripciones de telemetría WebSocket |
| **Visualización** | Recharts 3.8 + Leaflet / React-Leaflet 5.0 | Gráficos SVG interactivos y mapas geoespaciales |
| **Formularios** | React Hook Form 7.85 + Zod 4 | Validación tipada y optimizada con `useWatch` |
| **Gestión de Estado** | Zustand 5.0 | Estado global ligero para autenticación y sesión |
| **Notificaciones** | Sileo 0.1.5 *(reemplazó a Sonner)* | Notificaciones fluidas con morphing SVG y spring physics |
| **Iconografía** | Lucide React | Catálogo de iconos vectoriales |

---

## 🚀 Inicio Rápido

### 1. Requisitos Previos
- **Node.js**: `v20.x` o `v22.x` LTS
- **Package Manager**: `pnpm` (versión 10+)
- **Betty API**: Ejecutándose localmente en `http://localhost:3000` (o configurada en `.env.local`)

### 2. Instalación de Dependencias

```bash
pnpm install
```

### 3. Configuración de Entorno

Crea un archivo `.env.local` en la raíz de `betty-client`:

```env
# URL de la API Backend NestJS
NEXT_PUBLIC_API_URL=http://localhost:3000/api

# URL del Gateway WebSocket Socket.IO
NEXT_PUBLIC_WS_URL=http://localhost:3000
```

### 4. Ejecución en Desarrollo

```bash
# Inicia el servidor de desarrollo en el puerto 5173
pnpm run dev
```

Abre [http://localhost:5173](http://localhost:5173) en tu navegador.

---

## 💻 Scripts Disponibles

```bash
# Servidor de desarrollo con hot-reload (puerto 5173)
pnpm run dev

# Verificación de linter (ESLint + React 19 Compiler rules)
pnpm run lint

# Compilación optimizada para producción (Turbopack)
pnpm run build

# Iniciar servidor de producción
pnpm run start
```

---

## 📂 Estructura del Proyecto

```
betty-client/
├── src/
│   ├── app/
│   │   ├── [locale]/
│   │   │   ├── (auth)/         # Login, Registro, Recuperación de contraseña, OAuth Callback
│   │   │   ├── (dashboard)/    # Overview, Sensores, Tableros, Equipos, Admin, Settings
│   │   │   ├── explore/        # Explorador público de tableros
│   │   │   ├── layout.tsx      # Layout raíz con proveedores y contexto i18n
│   │   │   └── page.tsx        # Landing Page pública
│   │   ├── favicon.ico
│   │   └── globals.css         # Tokens de diseño OKLCH y utilidades de telemetría
│   ├── components/
│   │   ├── auth/               # Formularios y botones de autenticación (Google OAuth)
│   │   ├── dashboard/          # Renderizador de tableros, modales y widgets
│   │   │   └── widgets/        # Widgets: LineChart, Gauge, Metric, BarChart, Table, Map
│   │   ├── landing/            # Secciones Hero, Características, Funcionamiento y Footer
│   │   ├── layout/             # Header con estado WebSocket, Sidebar interactivo, LocaleSwitcher
│   │   ├── providers/          # SWRProvider, SocketProvider, ThemeProvider, Toaster (Sileo)
│   │   ├── sensors/            # Listas, gráficos históricos y modales de sensores
│   │   ├── teams/              # Tarjetas de equipos y diálogos de invitación
│   │   └── ui/                 # Componentes Base UI / Shadcn / Toaster
│   ├── hooks/                  # Hooks personalizados (useIsMobile con useSyncExternalStore)
│   ├── i18n/                   # Configuración y enrutamiento de internacionalización
│   ├── lib/                    # Clientes API, Socket.IO singleton y toast wrapper unificado (`toast.ts`)
│   ├── messages/               # Diccionarios de traducción (es.json, en.json)
│   ├── stores/                 # Stores de Zustand (auth-store con persistencia)
│   └── types/                  # Definiciones de TypeScript unificadas
├── eslint.config.mjs           # Configuración ESLint plana para Next.js y React 19
├── next.config.ts              # Configuración Next.js con soporte Turbopack y next-intl
└── package.json
```

---

## 📄 Licencia

Este proyecto está bajo la Licencia **MIT** ([LICENSE](./LICENSE)).
