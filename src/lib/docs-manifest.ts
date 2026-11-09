export interface DocItem {
  slug: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
}

export interface DocCategory {
  id: string;
  title: string;
  titleEn: string;
  icon: string;
  items: DocItem[];
}

export const DOCS_MANIFEST: DocCategory[] = [
  {
    id: 'getting-started',
    title: '🚀 Primeros Pasos',
    titleEn: '🚀 Getting Started',
    icon: 'Rocket',
    items: [
      {
        slug: 'getting-started/introduction',
        title: 'Introducción a Botuto',
        titleEn: 'Introduction to Botuto',
        description: 'Visión general de Botuto, la plataforma abierta de IoT y Gemelos Digitales.',
        descriptionEn: 'Architectural overview of Botuto open source platform for IoT and Digital Twins.',
      },
      {
        slug: 'getting-started/quickstart',
        title: 'Inicio Rápido en 5 Minutos',
        titleEn: 'Quickstart in 5 Minutes',
        description: 'Aprende a registrar tu primer sensor y enviar telemetría a Botuto.',
        descriptionEn: 'Register your first sensor and transmit live telemetry to Botuto.',
      },
      {
        slug: 'getting-started/architecture',
        title: 'Arquitectura del Sistema',
        titleEn: 'System Architecture',
        description: 'Componentes centrales, flujo de datos y modelo de capas de Botuto.',
        descriptionEn: 'Internal data flow, hexagonal architecture, and infrastructure components.',
      },
    ],
  },
  {
    id: 'protocols',
    title: '📡 Protocolos de Ingesta',
    titleEn: '📡 Ingestion Protocols',
    icon: 'Radio',
    items: [
      {
        slug: 'protocols/mqtt',
        title: 'Ingesta MQTT (EMQX)',
        titleEn: 'MQTT Ingestion (EMQX)',
        description: 'Protocolo de mensajería para sensores IoT y transmisiones de telemetría.',
        descriptionEn: 'Messaging protocol specifications for hardware devices and simulations.',
      },
      {
        slug: 'protocols/websocket',
        title: 'WebSocket Gateway en Tiempo Real',
        titleEn: 'Real-Time WebSocket Gateway',
        description: 'Conexión bidireccional y suscripciones en tiempo real con Socket.IO.',
        descriptionEn: 'Low-latency bidirectional subscriptions using Socket.IO.',
      },
      {
        slug: 'protocols/rest-api',
        title: 'Referencia de API REST',
        titleEn: 'REST API Reference',
        description: 'Especificación técnica de endpoints HTTP, autenticación y respuestas.',
        descriptionEn: 'HTTP endpoint catalog, authentication headers, and standard response envelopes.',
      },
    ],
  },
  {
    id: 'hardware',
    title: '🛠️ Hardware & Microcontroladores',
    titleEn: '🛠️ Hardware & Microcontrollers',
    icon: 'Cpu',
    items: [
      {
        slug: 'hardware/esp32',
        title: 'Guía de Conexión ESP32 (C++/Arduino)',
        titleEn: 'ESP32 Hardware Guide (C++/Arduino)',
        description: 'Código completo y configuración para conectar placas ESP32 a Botuto.',
        descriptionEn: 'Complete firmware template for connecting ESP32 to Botuto.',
      },
      {
        slug: 'hardware/esp8266',
        title: 'Guía de Conexión ESP8266 (NodeMCU)',
        titleEn: 'ESP8266 Hardware Guide (NodeMCU)',
        description: 'Configuración y ejemplo para placas ESP8266 conectadas a Botuto.',
        descriptionEn: 'Sample firmware and setup for ESP8266 microcontrollers.',
      },
      {
        slug: 'hardware/sensors-guide',
        title: 'Sensores Físicos Compatibles',
        titleEn: 'Compatible Physical Sensors',
        description: 'Lista y diagramas de conexionado para sensores ambientales y de movimiento.',
        descriptionEn: 'Wiring and JSON data structures for popular environmental sensors.',
      },
    ],
  },
  {
    id: 'metaverses',
    title: '🌐 Gemelos Digitales & Metaversos',
    titleEn: '🌐 Digital Twins & Metaverses',
    icon: 'Box',
    items: [
      {
        slug: 'metaverses/digital-twins',
        title: 'Concepto de Gemelos Digitales en Botuto',
        titleEn: 'Digital Twins Concept',
        description: 'Correlación entre flujos de datos de hardware físico y entornos virtuales 3D.',
        descriptionEn: 'Correlating physical sensor data with 3D virtual metaverse twins.',
      },
      {
        slug: 'metaverses/threejs-integration',
        title: 'Integración 3D con Three.js',
        titleEn: 'Three.js Real-Time 3D Integration',
        description: 'Cómo conectar un modelo 3D GLTF/GLB a la telemetría en vivo.',
        descriptionEn: 'Binding 3D CAD models to live WebSocket telemetry.',
      },
      {
        slug: 'metaverses/unity-unreal',
        title: 'Motores 3D (Unity / Unreal Engine)',
        titleEn: '3D Engines (Unity / Unreal Engine)',
        description: 'Cómo conectar entornos de simulación a la ingesta de Botuto.',
        descriptionEn: 'Connecting game engines and metaverse simulations to Botuto.',
      },
    ],
  },
  {
    id: 'projects',
    title: '🧩 Proyectos DIY & Flasheo USB',
    titleEn: '🧩 DIY Projects & USB Flashing',
    icon: 'Wrench',
    items: [
      {
        slug: 'projects/replicable-projects',
        title: 'Proyectos Replicables en Botuto',
        titleEn: 'Replicable Projects',
        description: 'Guía para crear y publicar proyectos guiados con modelos 3D y firmware.',
        descriptionEn: 'Step-by-step DIY IoT guides, materials BOM, and 3D CAD viewer.',
      },
      {
        slug: 'projects/firmware-flashing',
        title: 'Flasheo de Firmware por Web Serial (USB)',
        titleEn: 'Web Serial USB Firmware Flashing',
        description: 'Instalación de firmware directa desde el navegador sin instalar herramientas locales.',
        descriptionEn: 'In-browser USB firmware installation powered by esptool-js.',
      },
    ],
  },
  {
    id: 'security',
    title: '🔒 Seguridad & RBAC',
    titleEn: '🔒 Security & RBAC',
    icon: 'ShieldCheck',
    items: [
      {
        slug: 'security/rbac-roles',
        title: 'Roles y Permisos (RBAC)',
        titleEn: 'Roles and Permissions (RBAC)',
        description: 'Sistema unificado de control de acceso basado en roles para la plataforma y equipos.',
        descriptionEn: 'Unified relational role-based access control for platform and team workspaces.',
      },
      {
        slug: 'security/api-keys',
        title: 'Gestión Segura de API Keys',
        titleEn: 'API Key Cryptographic Management',
        description: 'Cómo se generan, hashean y auditan las claves criptográficas en Botuto.',
        descriptionEn: 'How per-sensor keys are generated, hashed with SHA-256, and audited.',
      },
    ],
  },
  {
    id: 'sdks',
    title: '💻 SDKs & Ejemplos de Código',
    titleEn: '💻 SDKs & Code Examples',
    icon: 'Code',
    items: [
      {
        slug: 'sdks/nodejs-ts',
        title: 'Cliente Node.js / TypeScript',
        titleEn: 'Node.js / TypeScript Client',
        description: 'Ejemplo de integración y publicación de telemetría con Node.js y TypeScript.',
        descriptionEn: 'Connecting Node.js applications to Botuto via MQTT and WebSockets.',
      },
      {
        slug: 'sdks/python',
        title: 'Cliente Python',
        titleEn: 'Python Client',
        description: 'Script de publicación de datos y consumo de telemetría con Python.',
        descriptionEn: 'Streaming telemetry from Python applications with paho-mqtt.',
      },
      {
        slug: 'sdks/arduino-cpp',
        title: 'Cliente Arduino / C++',
        titleEn: 'Arduino / C++ Client',
        description: 'Librería y clase reutilizable en C++ para microcontroladores ESP32 y ESP8266.',
        descriptionEn: 'Reusable C++ class for ESP32 and ESP8266 devices.',
      },
    ],
  },
];

export interface DocHeading {
  id: string;
  text: string;
  level: number;
}

export interface DocContent {
  slug: string;
  title: string;
  description: string;
  content: string;
  headings: DocHeading[];
  prev?: { slug: string; title: string };
  next?: { slug: string; title: string };
}
