'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSensors } from '@/lib/api/sensors';
import { useDashboards } from '@/lib/api/dashboards';
import { useTeams } from '@/lib/api/teams';
import { useAuthStore } from '@/stores/auth-store';
import { useSocket } from '@/components/providers/socket-provider';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreateSensorDialog } from '@/components/sensors/create-sensor-dialog';
import { SensorStatusBadge } from '@/components/sensors/sensor-status-badge';
import { Link } from '@/i18n/routing';
import {
  Radio,
  LineChart,
  Users,
  Zap,
  Activity,
  ArrowRight,
  Database,
  Server,
  Copy,
  Check,
  ExternalLink,
  BookOpen,
  Wifi,
  Globe,
} from 'lucide-react';

export default function OverviewPage() {
  const t = useTranslations('overview');
  const { user } = useAuthStore();
  const { isConnected } = useSocket();
  const { sensors, mutate: mutateSensors } = useSensors();
  const { dashboards } = useDashboards();
  const { teams } = useTeams();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const activeSensorsCount = sensors.filter((s) => s.status === 'active').length;

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} subtitle={t('subtitle')}>
        <CreateSensorDialog onSuccess={() => mutateSensors()} />
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border/70 bg-card/80 backdrop-blur shadow-sm hover:border-cyan-500/30 transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('totalSensors')}</p>
              <p className="text-3xl font-extrabold font-mono text-foreground">{sensors.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400">
              <Radio className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card/80 backdrop-blur shadow-sm hover:border-emerald-500/30 transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('activeSensors')}</p>
              <p className="text-3xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                {activeSensorsCount}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Zap className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card/80 backdrop-blur shadow-sm hover:border-indigo-500/30 transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('totalDashboards')}</p>
              <p className="text-3xl font-extrabold font-mono text-foreground">{dashboards.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <LineChart className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/70 bg-card/80 backdrop-blur shadow-sm hover:border-purple-500/30 transition-all">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Telemetría en Vivo</p>
              <div className="flex items-center gap-2 pt-1">
                <span className={`h-2.5 w-2.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span className="text-sm font-bold font-mono text-foreground">
                  {isConnected ? 'EN LÍNEA' : 'CONECTANDO'}
                </span>
              </div>
            </div>
            <div className={`p-3 rounded-xl ${isConnected ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
              <Wifi className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Sensors Overview */}
        <Card className="lg:col-span-2 border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between p-5 pb-3">
            <div className="space-y-0.5">
              <CardTitle className="text-base font-bold">Dispositivos y Sensores</CardTitle>
              <CardDescription className="text-xs">
                Listado rápido de sensores configurados en tu cuenta
              </CardDescription>
            </div>
            <Button
              render={<Link href="/sensors" />}
              variant="ghost"
              size="sm"
              className="gap-1 text-xs h-8 font-semibold"
            >
              <span>Ver todos</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="p-5 pt-0">
            {sensors.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center rounded-lg border border-dashed bg-muted/20 space-y-3">
                <Radio className="h-8 w-8 text-muted-foreground opacity-50" />
                <p className="text-sm font-medium">No tienes sensores registrados</p>
                <CreateSensorDialog onSuccess={() => mutateSensors()} />
              </div>
            ) : (
              <div className="divide-y divide-border">
                {sensors.slice(0, 5).map((sensor) => (
                  <div
                    key={sensor.id}
                    className="flex items-center justify-between py-3 hover:bg-muted/30 px-2 rounded transition-colors"
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div className="p-2 rounded bg-muted text-foreground">
                        <Radio className="h-4 w-4" />
                      </div>
                      <div className="truncate">
                        <Link
                          href={`/sensors/${sensor.id}`}
                          className="font-medium text-sm hover:underline truncate block"
                        >
                          {sensor.name}
                        </Link>
                        <p className="text-xs font-mono text-muted-foreground truncate">
                          {sensor.mqttTopic}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <SensorStatusBadge status={sensor.status} />
                      <Button
                        render={<Link href={`/sensors/${sensor.id}`} />}
                        size="sm"
                        variant="ghost"
                        className="h-8 px-2"
                      >
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* User-Relevant Context Panel */}
        <div className="space-y-6">
          {/* Connection Parameters Card (Directly Useful to User) */}
          <Card className="border shadow-sm">
            <CardHeader className="p-5 pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Radio className="h-4 w-4 text-emerald-500" />
                  <CardTitle className="text-base font-bold">Parámetros de Ingesta</CardTitle>
                </div>
                <Link
                  href="/docs/getting-started/quickstart"
                  className="text-[11px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-medium"
                >
                  <BookOpen className="h-3 w-3" />
                  <span>Guía</span>
                </Link>
              </div>
              <CardDescription className="text-xs">
                Datos para conectar tu microcontrolador o script
              </CardDescription>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-2.5">
              <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60 space-y-1">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>Host MQTT</span>
                  <button
                    onClick={() => copyToClipboard('botuto.laboratorio3d.online', 'host')}
                    className="hover:text-foreground flex items-center gap-1 cursor-pointer"
                  >
                    {copiedField === 'host' ? (
                      <Check className="h-3 w-3 text-emerald-500" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </button>
                </div>
                <p className="font-mono text-xs font-semibold text-foreground">
                  botuto.laboratorio3d.online
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 rounded-lg bg-muted/40 border border-border/60">
                  <span className="text-[10px] text-muted-foreground block">Puerto TCP</span>
                  <span className="font-mono text-xs font-semibold">1883</span>
                </div>
                <div className="p-2 rounded-lg bg-muted/40 border border-border/60">
                  <span className="text-[10px] text-muted-foreground block">Puerto WSS</span>
                  <span className="font-mono text-xs font-semibold">8083</span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60 space-y-1">
                <span className="text-[10px] text-muted-foreground block">Tópico de Publicación</span>
                <p className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 truncate">
                  botuto/sensor/&lt;sensorId&gt;/data
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Card */}
          <Card className="border shadow-sm">
            <CardHeader className="p-5 pb-3">
              <CardTitle className="text-base font-bold">{t('quickActions')}</CardTitle>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-2">
              <Button
                render={<Link href="/dashboards" />}
                variant="outline"
                className="w-full justify-start text-xs h-9 gap-2"
              >
                <LineChart className="h-4 w-4 text-blue-500" />
                <span>{t('newDashboard')}</span>
              </Button>
              <Button
                render={<Link href="/digital-twin" />}
                variant="outline"
                className="w-full justify-start text-xs h-9 gap-2"
              >
                <Activity className="h-4 w-4 text-purple-500" />
                <span>Ver Gemelo Digital (Plano 2D)</span>
              </Button>
              <Button
                render={
                  <a
                    href={process.env.NEXT_PUBLIC_UA3D_URL || 'https://laboratorio3d.online'}
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                }
                variant="outline"
                className="w-full justify-start text-xs h-9 gap-2"
              >
                <Globe className="h-4 w-4 text-emerald-500" />
                <span>Campus Virtual 3D (OpenSim)</span>
                <ExternalLink className="ml-auto h-3 w-3 text-muted-foreground" />
              </Button>
            </CardContent>
          </Card>

          {/* System Health Card (Strictly for Admins) */}
          {user?.role === 'admin' && (
            <Card className="border shadow-sm border-dashed">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center gap-2">
                  <Server className="h-3.5 w-3.5 text-amber-500" />
                  <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    Infraestructura (Admin)
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-2 text-[11px]">
                <div className="flex items-center justify-between py-1 border-b">
                  <span className="text-muted-foreground">Gateway Socket.IO</span>
                  <span className="font-mono text-emerald-500">/realtime</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b">
                  <span className="text-muted-foreground">TimescaleDB</span>
                  <span className="font-mono text-muted-foreground">PostgreSQL 16</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground">Broker MQTT</span>
                  <span className="font-mono text-muted-foreground">EMQX 5.8</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
