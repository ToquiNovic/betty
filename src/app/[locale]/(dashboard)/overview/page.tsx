'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { useSensors } from '@/lib/api/sensors';
import { useDashboards } from '@/lib/api/dashboards';
import { useTeams } from '@/lib/api/teams';
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
} from 'lucide-react';

export default function OverviewPage() {
  const t = useTranslations('overview');
  const { sensors, mutate: mutateSensors } = useSensors();
  const { dashboards } = useDashboards();
  const { teams } = useTeams();

  const activeSensorsCount = sensors.filter((s) => s.status === 'active').length;

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
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t('totalTeams')}</p>
              <p className="text-3xl font-extrabold font-mono text-foreground">{teams.length}</p>
            </div>
            <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Users className="h-5 w-5" />
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

        {/* System Health / Quick Links */}
        <div className="space-y-6">
          <Card className="border shadow-sm">
            <CardHeader className="p-5 pb-3">
              <div className="flex items-center gap-2">
                <Server className="h-4 w-4 text-primary" />
                <CardTitle className="text-base font-bold">{t('systemHealth')}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-5 pt-0 space-y-3">
              <div className="flex items-center justify-between text-xs py-1.5 border-b">
                <div className="flex items-center gap-2">
                  <Activity className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="font-medium">{t('realtimeGateway')}</span>
                </div>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                  Socket.IO /realtime
                </span>
              </div>

              <div className="flex items-center justify-between text-xs py-1.5 border-b">
                <div className="flex items-center gap-2">
                  <Database className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="font-medium">{t('databaseStatus')}</span>
                </div>
                <span className="font-mono text-muted-foreground">PostgreSQL 16</span>
              </div>

              <div className="flex items-center justify-between text-xs py-1.5">
                <div className="flex items-center gap-2">
                  <Radio className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="font-medium">{t('brokerStatus')}</span>
                </div>
                <span className="font-mono text-muted-foreground">EMQX 5.8</span>
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
                render={<Link href="/teams" />}
                variant="outline"
                className="w-full justify-start text-xs h-9 gap-2"
              >
                <Users className="h-4 w-4 text-indigo-500" />
                <span>{t('newTeam')}</span>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
