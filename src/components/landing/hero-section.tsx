'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  Zap,
  Database,
  Globe,
  Radio,
  Activity,
  Layers,
  Thermometer,
  Droplets,
  Cpu,
  CheckCircle2,
} from 'lucide-react';

export function HeroSection() {
  const t = useTranslations('landing');
  const [activeTab, setActiveTab] = useState<'physical' | 'digital'>('physical');
  const [telemetryVal, setTelemetryVal] = useState({
    temp: 23.4,
    humidity: 58.2,
    vibration: 0.14,
    fps: 60,
  });

  // Simulated live sensor stream fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setTelemetryVal({
        temp: Number((23.0 + Math.random() * 1.2).toFixed(1)),
        humidity: Number((57.5 + Math.random() * 2.0).toFixed(1)),
        vibration: Number((0.10 + Math.random() * 0.08).toFixed(2)),
        fps: Math.round(58 + Math.random() * 4),
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28">
      {/* Background Subtle Gradient Glow & Grid */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[700px] h-[380px] bg-gradient-to-tr from-primary/20 via-cyan-500/15 to-indigo-500/10 blur-3xl -z-10 pointer-events-none rounded-full" />
      <div className="absolute inset-0 bg-grid-subtle opacity-40 -z-20 pointer-events-none" />

      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center text-center space-y-7 max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/5 text-primary text-xs font-semibold tracking-wide uppercase shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <Radio className="h-3.5 w-3.5 text-primary" />
            <span>{t('badge')}</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-foreground max-w-3xl leading-[1.12]">
            {t('heroTitle')}
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
            {t('heroSubtitle')}
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
            <Button
              render={<Link href="/register" />}
              size="lg"
              className="h-12 px-8 text-base font-semibold shadow-lg shadow-primary/25 gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 text-white"
            >
              <span>{t('ctaStart')}</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              render={<Link href="/explore" />}
              variant="outline"
              size="lg"
              className="h-12 px-8 text-base font-semibold border-border/80 hover:bg-muted/50 gap-2 backdrop-blur-sm"
            >
              <Globe className="h-4 w-4 text-cyan-500" />
              <span>{t('ctaExplore')}</span>
            </Button>
          </div>

          {/* Hero Interactive Telemetry Showcase Card */}
          <div className="w-full pt-8">
            <Card className="border border-border/80 bg-card/80 backdrop-blur-xl shadow-xl overflow-hidden text-left transition-all hover:border-primary/40">
              {/* Showcase Header & Tab Selector */}
              <div className="border-b border-border/60 bg-muted/40 px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex gap-1.5">
                    <div className="h-3 w-3 rounded-full bg-rose-500/80" />
                    <div className="h-3 w-3 rounded-full bg-amber-500/80" />
                    <div className="h-3 w-3 rounded-full bg-emerald-500/80" />
                  </div>
                  <span className="text-xs font-mono text-muted-foreground ml-2 truncate">
                    topic: <span className="text-foreground font-semibold">betty/sensor/{activeTab === 'physical' ? 'esp32-node-01' : 'digital-twin-sim'}/data</span>
                  </span>
                </div>

                {/* Scope Switcher Tabs */}
                <div className="flex items-center rounded-lg bg-background/80 p-1 border border-border/60 text-xs font-medium self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setActiveTab('physical')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all cursor-pointer ${
                      activeTab === 'physical'
                        ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Cpu className="h-3.5 w-3.5" />
                    <span>Sensor Físico</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('digital')}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all cursor-pointer ${
                      activeTab === 'digital'
                        ? 'bg-indigo-600 text-white font-semibold shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Layers className="h-3.5 w-3.5" />
                    <span>Gemelo Digital (3D)</span>
                  </button>
                </div>
              </div>

              {/* Showcase Body with Live Values */}
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left Column: Live KPI metrics */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="font-semibold uppercase tracking-wider">Telemetría en Vivo</span>
                      <span className="inline-flex items-center gap-1.5 text-emerald-500 font-mono text-[11px]">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                        STREAMING
                      </span>
                    </div>

                    {activeTab === 'physical' ? (
                      <>
                        <div className="p-3.5 rounded-xl bg-muted/40 border border-border/50 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
                              <Thermometer className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground font-medium">Temperatura</div>
                              <div className="text-lg font-bold font-mono text-foreground">{telemetryVal.temp} °C</div>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30 bg-emerald-500/10">
                            Óptimo
                          </Badge>
                        </div>

                        <div className="p-3.5 rounded-xl bg-muted/40 border border-border/50 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              <Droplets className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground font-medium">Humedad Relativa</div>
                              <div className="text-lg font-bold font-mono text-foreground">{telemetryVal.humidity} %</div>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[10px] text-cyan-600 border-cyan-500/30 bg-cyan-500/10">
                            Estable
                          </Badge>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="p-3.5 rounded-xl bg-muted/40 border border-border/50 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                              <Activity className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground font-medium">Vibración Estructural</div>
                              <div className="text-lg font-bold font-mono text-foreground">{telemetryVal.vibration} g</div>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[10px] text-indigo-600 border-indigo-500/30 bg-indigo-500/10">
                            Simulado
                          </Badge>
                        </div>

                        <div className="p-3.5 rounded-xl bg-muted/40 border border-border/50 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
                              <Layers className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="text-xs text-muted-foreground font-medium">Render Frame Rate</div>
                              <div className="text-lg font-bold font-mono text-foreground">{telemetryVal.fps} FPS</div>
                            </div>
                          </div>
                          <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-500/30 bg-emerald-500/10">
                            Fluido
                          </Badge>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Center/Right Column: Live Simulated SVG Waveform */}
                  <div className="md:col-span-2 flex flex-col justify-between p-4 rounded-xl bg-muted/30 border border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Activity className="h-3.5 w-3.5 text-primary" />
                        Histórico en Tiempo Real (TimescaleDB)
                      </span>
                      <span className="text-[11px] font-mono text-muted-foreground">Últimos 60 segundos</span>
                    </div>

                    {/* Smooth Area Waveform */}
                    <div className="h-28 w-full relative flex items-end">
                      <svg viewBox="0 0 300 80" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="heroGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M 0,60 Q 30,20 60,40 T 120,30 T 180,50 T 240,25 T 300,35 L 300,80 L 0,80 Z"
                          fill="url(#heroGradient)"
                        />
                        <path
                          d="M 0,60 Q 30,20 60,40 T 120,30 T 180,50 T 240,25 T 300,35"
                          fill="none"
                          stroke="var(--color-primary)"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                        <circle cx="300" cy="35" r="4" fill="var(--color-primary)" className="animate-ping opacity-75" />
                        <circle cx="300" cy="35" r="4" fill="var(--color-primary)" />
                      </svg>
                    </div>

                    {/* Pipeline Status Badges */}
                    <div className="pt-3 border-t border-border/40 flex items-center justify-between text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-emerald-500 font-medium">
                          <CheckCircle2 className="h-3 w-3" /> EMQX MQTT (1883)
                        </span>
                        <span className="flex items-center gap-1 text-cyan-500 font-medium">
                          <CheckCircle2 className="h-3 w-3" /> Dragonfly Pub/Sub
                        </span>
                      </div>
                      <span className="font-mono text-foreground font-semibold">&lt; 2ms push</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Hero 4 Key Metric Summary Cards */}
          <div className="w-full pt-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
              <Card className="border border-border/60 bg-card/60 backdrop-blur shadow-sm hover:border-cyan-500/40 transition-all hover:-translate-y-0.5">
                <CardContent className="p-4 sm:p-5 flex items-center gap-3.5">
                  <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shrink-0">
                    <Zap className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-foreground">50k+</div>
                    <div className="text-xs text-muted-foreground font-medium">Msg / seg MQTT</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border/60 bg-card/60 backdrop-blur shadow-sm hover:border-emerald-500/40 transition-all hover:-translate-y-0.5">
                <CardContent className="p-4 sm:p-5 flex items-center gap-3.5">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                    <Database className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-foreground">&lt; 5ms</div>
                    <div className="text-xs text-muted-foreground font-medium">Timescale Query</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border/60 bg-card/60 backdrop-blur shadow-sm hover:border-indigo-500/40 transition-all hover:-translate-y-0.5">
                <CardContent className="p-4 sm:p-5 flex items-center gap-3.5">
                  <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0">
                    <Radio className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-foreground">100%</div>
                    <div className="text-xs text-muted-foreground font-medium">Realtime Push</div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border border-border/60 bg-card/60 backdrop-blur shadow-sm hover:border-purple-500/40 transition-all hover:-translate-y-0.5">
                <CardContent className="p-4 sm:p-5 flex items-center gap-3.5">
                  <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                    <Globe className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xl sm:text-2xl font-bold font-mono tracking-tight text-foreground">Dual</div>
                    <div className="text-xs text-muted-foreground font-medium">Físico & Metaverso</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
