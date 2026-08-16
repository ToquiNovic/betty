'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KeyRound, Radio, LineChart, Copy, Check, Terminal, Code2 } from 'lucide-react';
import { toast } from '@/lib/toast';

export function HowItWorks() {
  const t = useTranslations('landing');
  const [activeCodeTab, setActiveCodeTab] = useState<'cli' | 'python' | 'node' | 'esp32'>('cli');
  const [copied, setCopied] = useState(false);

  const steps = [
    {
      icon: KeyRound,
      number: '01',
      title: t('step1Title'),
      description: t('step1Desc'),
      highlight: 'SHA-256 API Key',
    },
    {
      icon: Radio,
      number: '02',
      title: t('step2Title'),
      description: t('step2Desc'),
      highlight: 'betty/sensor/:id/data',
    },
    {
      icon: LineChart,
      number: '03',
      title: t('step3Title'),
      description: t('step3Desc'),
      highlight: 'WebSocket Streaming',
    },
  ];

  const codeSnippets = {
    cli: `# Ingesta instantánea con Mosquitto CLI
mosquitto_pub -h localhost -p 1883 \\
  -u "<SENSOR_ID>" \\
  -P "betty_live_abc123..." \\
  -t "betty/sensor/<SENSOR_ID>/data" \\
  -m '{"origin_type":"sensor","temperature":23.4,"humidity":58.2}'`,
    python: `# Ingesta en Python con paho-mqtt
import paho.mqtt.client as mqtt, json

client = mqtt.Client(client_id="esp32-node")
client.username_pw_set(username="<SENSOR_ID>", password="betty_live_abc123...")
client.connect("localhost", 1883, 60)

payload = {"origin_type": "sensor", "temperature": 23.4, "humidity": 58.2}
client.publish("betty/sensor/<SENSOR_ID>/data", json.dumps(payload))`,
    node: `// Ingesta en Node.js / TypeScript
import mqtt from "mqtt";

const client = mqtt.connect("mqtt://localhost:1883", {
  username: "<SENSOR_ID>",
  password: "betty_live_abc123...",
});

client.on("connect", () => {
  const data = { origin_type: "metaverso", position_x: 120.5, users_count: 42 };
  client.publish("betty/sensor/<SENSOR_ID>/data", JSON.stringify(data));
});`,
    esp32: `// Microcontrolador ESP32 (Arduino C++)
#include <WiFi.h>
#include <PubSubClient.h>

WiFiClient espClient;
PubSubClient client(espClient);

void sendTelemetry() {
  client.setServer("192.168.1.100", 1883);
  if (client.connect("ESP32_Device", "<SENSOR_ID>", "betty_live_abc123...")) {
    client.publish("betty/sensor/<SENSOR_ID>/data", "{\\"origin_type\\":\\"sensor\\",\\"temp\\":23.4}");
  }
}`,
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(codeSnippets[activeCodeTab]);
    setCopied(true);
    toast.success('¡Código copiado al portapapeles!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="how-it-works" className="py-24 border-t border-border/60 relative">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-xs font-semibold uppercase tracking-wider">
            <Code2 className="h-3.5 w-3.5" />
            <span>Flujo de Integración</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
            {t('howItWorksTitle')}
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground leading-relaxed">
            {t('heroSubtitle')}
          </p>
        </div>

        {/* 3 Steps Pipeline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <Card
                key={idx}
                className="relative border border-border/70 bg-card/70 backdrop-blur-sm p-6 hover:shadow-lg hover:border-primary/50 transition-all duration-300 group"
              >
                <CardContent className="p-0 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-semibold transition-transform group-hover:scale-110 shadow-xs">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-3xl font-extrabold text-muted-foreground/25 font-mono">
                      {step.number}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold tracking-tight text-foreground">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                  <div className="pt-2">
                    <span className="inline-block px-2.5 py-1 rounded-md bg-muted text-[11px] font-mono font-medium text-foreground/80 border border-border/60">
                      {step.highlight}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Interactive Ingest Code Snippet Card */}
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl border border-border/80 bg-card/90 backdrop-blur-xl shadow-xl overflow-hidden">
            {/* Snippet Header */}
            <div className="border-b border-border/60 bg-muted/40 px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Terminal className="h-4 w-4 text-primary" />
                <span>Ejemplo de Publicación MQTT</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex rounded-lg bg-background p-1 border border-border/60 text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveCodeTab('cli')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      activeCodeTab === 'cli'
                        ? 'bg-primary text-primary-foreground font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    CLI
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCodeTab('python')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      activeCodeTab === 'python'
                        ? 'bg-primary text-primary-foreground font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Python
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCodeTab('node')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      activeCodeTab === 'node'
                        ? 'bg-primary text-primary-foreground font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Node.js
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCodeTab('esp32')}
                    className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                      activeCodeTab === 'esp32'
                        ? 'bg-primary text-primary-foreground font-semibold'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    ESP32 (C++)
                  </button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="h-8 gap-1 text-xs border-border/70"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Copiado' : 'Copiar'}</span>
                </Button>
              </div>
            </div>

            {/* Snippet Code View */}
            <div className="p-5 font-mono text-xs overflow-x-auto leading-relaxed bg-zinc-950 text-zinc-100 dark:bg-black/60">
              <pre className="whitespace-pre">{codeSnippets[activeCodeTab]}</pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
