import React from 'react';
import Link from 'next/link';
import { getLocale } from 'next-intl/server';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { DocsTabs } from '@/components/docs/docs-tabs';
import { DOCS_MANIFEST } from '@/lib/docs-manifest';
import {
  Rocket,
  Radio,
  Cpu,
  Box,
  Wrench,
  ShieldCheck,
  Code,
  ArrowRight,
  Sparkles,
  Zap,
  Terminal,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Rocket,
  Radio,
  Cpu,
  Box,
  Wrench,
  ShieldCheck,
  Code,
};

const SAMPLE_CODE_TABS = [
  {
    label: 'cURL / HTTP Webhook',
    language: 'bash',
    code: `curl -X POST http://localhost:3000/api/mqtt/webhook \\
  -H "Content-Type: application/json" \\
  -d '{
    "topic": "betty/sensor/sn_lab_01/data",
    "payload": {
      "temperature": 23.4,
      "humidity": 58.2,
      "origin_type": "sensor"
    }
  }'`,
  },
  {
    label: 'ESP32 (C++ / Arduino)',
    language: 'cpp',
    code: `#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>

const char* ssid = "MI_WIFI";
const char* password = "PASSWORD";
const char* mqtt_server = "broker.betty.local";
const char* sensor_id = "sn_lab_01";
const char* api_key = "betty_live_a1b2c3d4e5f6...";

WiFiClient espClient;
PubSubClient client(espClient);

void sendTelemetry(float temp, float hum) {
  StaticJsonDocument<200> doc;
  doc["temperature"] = temp;
  doc["humidity"] = hum;
  doc["origin_type"] = "sensor";

  char buffer[256];
  serializeJson(doc, buffer);
  client.publish("betty/sensor/sn_lab_01/data", buffer);
}`,
  },
  {
    label: 'Python SDK',
    language: 'python',
    code: `import json
import paho.mqtt.client as mqtt

SENSOR_ID = "sn_lab_01"
API_KEY = "betty_live_a1b2c3d4e5f6..."
BROKER = "localhost"

client = mqtt.Client(client_id=f"sensor_{SENSOR_ID}")
client.username_pw_set(username=SENSOR_ID, password=API_KEY)
client.connect(BROKER, 1883, 60)

payload = {
    "temperature": 24.1,
    "humidity": 52.0,
    "origin_type": "sensor"
}

client.publish(f"betty/sensor/{SENSOR_ID}/data", json.dumps(payload))
print("Telemetría enviada exitosamente a Betty")`,
  },
  {
    label: 'Node.js / TypeScript',
    language: 'typescript',
    code: `import mqtt from 'mqtt';

const SENSOR_ID = 'sn_lab_01';
const API_KEY = 'betty_live_a1b2c3d4e5f6...';

const client = mqtt.connect('mqtt://localhost:1883', {
  username: SENSOR_ID,
  password: API_KEY,
});

client.on('connect', () => {
  const telemetry = {
    temperature: 22.8,
    humidity: 60.5,
    origin_type: 'sensor',
  };

  client.publish(
    \`betty/sensor/\${SENSOR_ID}/data\`,
    JSON.stringify(telemetry)
  );
  console.log('Datos transmitidos a Betty');
});`,
  },
];

export default async function DocsIndexPage() {
  const locale = await getLocale();
  const isEn = locale === 'en';

  return (
    <div className="max-w-4xl flex flex-col gap-10">
      {/* Hero Section */}
      <div className="flex flex-col gap-4 border-b border-border/60 pb-8">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1 px-2.5 py-0.5 text-xs bg-primary/10 text-primary border-primary/20">
            <Sparkles className="h-3 w-3" />
            <span>{isEn ? 'Official Documentation' : 'Documentación Oficial'}</span>
          </Badge>
          <span className="text-xs text-muted-foreground font-mono">v1.0.0</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-foreground">
          {isEn ? 'Developer Documentation' : 'Documentación para Desarrolladores'}
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
          {isEn
            ? 'Technical specifications, hardware integration templates, high-throughput protocols, and SDKs for IoT, Digital Twins, and Metaverses.'
            : 'Especificaciones técnicas, plantillas de hardware, protocolos de alta ingesta y SDKs para conectar sensores reales, gemelos digitales y metaversos a Betty.'}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Link href={`/${locale}/docs/getting-started/quickstart`}>
            <Button className="gap-2 font-medium shadow-md shadow-primary/20">
              <Rocket className="h-4 w-4" />
              <span>{isEn ? '5-Min Quickstart' : 'Inicio Rápido en 5 Min'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
          <Link href={`/${locale}/docs/protocols/mqtt`}>
            <Button variant="outline" className="gap-2 font-medium border-border/80">
              <Radio className="h-4 w-4 text-primary" />
              <span>{isEn ? 'MQTT Protocol' : 'Protocolo MQTT'}</span>
            </Button>
          </Link>
          <Link href={`/${locale}/docs/sdks/nodejs-ts`}>
            <Button variant="secondary" className="gap-2 font-medium">
              <Code className="h-4 w-4" />
              <span>{isEn ? 'Client SDKs' : 'Ver SDKs'}</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Interactive Code Examples */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-primary" />
          <h2 className="text-lg font-bold tracking-tight text-foreground">
            {isEn ? 'Ingest Data in Seconds' : 'Ingesta de Datos en Segundos'}
          </h2>
        </div>
        <p className="text-xs text-muted-foreground">
          {isEn
            ? 'Publish encrypted telemetry directly to EMQX or use our WebSocket and HTTP gateways.'
            : 'Publica telemetría autenticada vía MQTT (EMQX) o interactúa con nuestros gateways WebSocket y REST.'}
        </p>
        <DocsTabs tabs={SAMPLE_CODE_TABS} />
      </div>

      {/* Categories Grid */}
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground">
          {isEn ? 'Explore Modules & Guides' : 'Explora los Módulos y Guías'}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {DOCS_MANIFEST.map((category) => {
            const IconComponent = ICON_MAP[category.icon] || Rocket;
            const categoryTitle = isEn ? category.titleEn : category.title;
            const firstDoc = category.items[0];

            return (
              <Link key={category.id} href={`/${locale}/docs/${firstDoc.slug}`} className="group">
                <Card className="h-full border-border/70 bg-card/60 hover:bg-card hover:border-primary/50 transition-all shadow-sm hover:shadow-md">
                  <CardHeader className="p-5 pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                          <IconComponent className="h-4 w-4" />
                        </div>
                        <CardTitle className="text-base font-bold text-foreground group-hover:text-primary transition-colors">
                          {categoryTitle}
                        </CardTitle>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </CardHeader>
                  <CardContent className="p-5 pt-0">
                    <ul className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                      {category.items.map((item) => (
                        <li key={item.slug} className="flex items-center gap-1.5 hover:text-foreground transition-colors truncate">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary/40 group-hover:bg-primary shrink-0" />
                          <span className="truncate">{isEn ? item.titleEn : item.title}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
