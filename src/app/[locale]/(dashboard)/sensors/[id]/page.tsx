'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useRouter, Link } from '@/i18n/routing';
import { useSensor, useSensorData, sensorApi } from '@/lib/api/sensors';
import { useSensorRealtime } from '@/hooks/use-sensor-realtime';
import { SensorData } from '@/types';
import { SensorStatusBadge } from '@/components/sensors/sensor-status-badge';
import { SensorDataChart } from '@/components/sensors/sensor-data-chart';
import { SensorDataTable } from '@/components/sensors/sensor-data-table';
import { ApiKeyDisplayDialog } from '@/components/sensors/api-key-display';
import { ConfirmDialog } from '@/components/common/confirm-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  KeyRound,
  RotateCw,
  Ban,
  Trash2,
  ArrowLeft,
  Activity,
  Table,
  Settings,
  Copy,
  Check,
  Cpu,
} from 'lucide-react';
import { toast } from '@/lib/toast';
import { PlanoInclinadoVisualizer } from '@/components/projects/plano-inclinado/plano-inclinado-visualizer';

interface SensorSettingsFormProps {
  sensor: NonNullable<ReturnType<typeof useSensor>['sensor']>;
  onUpdated: () => void;
  nameLabel: string;
  descLabel: string;
  saveLabel: string;
  errorLabel: string;
}

function SensorSettingsForm({
  sensor,
  onUpdated,
  nameLabel,
  descLabel,
  saveLabel,
  errorLabel,
}: SensorSettingsFormProps) {
  const [name, setName] = useState(sensor.name);
  const [description, setDescription] = useState(sensor.description || '');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      await sensorApi.update(sensor.id, {
        name,
        description: description || undefined,
      });
      onUpdated();
      toast.success('Sensor actualizado correctamente');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : errorLabel;
      toast.error(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader className="p-5 pb-3">
        <CardTitle className="text-base font-bold">Editar Sensor</CardTitle>
        <CardDescription className="text-xs">
          Modifica el nombre o la descripción del dispositivo.
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleUpdate}>
        <CardContent className="p-5 pt-0 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">{nameLabel}</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isUpdating}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-desc">{descLabel}</Label>
            <Input
              id="edit-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isUpdating}
            />
          </div>
        </CardContent>
        <CardFooter className="p-5 pt-0 border-t bg-muted/10 py-3 flex justify-end">
          <Button type="submit" size="sm" disabled={isUpdating}>
            {saveLabel}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function SensorDetailPage() {
  const t = useTranslations('sensors');
  const common = useTranslations('common');
  const router = useRouter();
  const params = useParams();
  const sensorId = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const { sensor, isLoading: isSensorLoading, mutate: mutateSensor } = useSensor(sensorId);
  const { data: historicalData } = useSensorData(sensorId, { limit: 100 });
  const { latestData } = useSensorRealtime(sensorId);

  // Combine real-time reading + historical records
  const allReadings = React.useMemo(() => {
    const list: SensorData[] = [...historicalData];
    if (latestData && !list.some((d) => d.id === latestData.id)) {
      list.unshift(latestData);
    }
    return list;
  }, [historicalData, latestData]);

  // Dialog & state controls
  const [showRotateDialog, setShowRotateDialog] = useState(false);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [rotatedKeyData, setRotatedKeyData] = useState<{ rawApiKey: string } | null>(null);
  const [showRotatedKeyModal, setShowRotatedKeyModal] = useState(false);
  const [copiedTopic, setCopiedTopic] = useState(false);

  const handleRotateKey = async () => {
    try {
      const res = await sensorApi.rotateApiKey(sensorId);
      mutateSensor();
      setRotatedKeyData(res);
      setShowRotatedKeyModal(true);
      toast.success('API Key rotada exitosamente');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : common('error');
      toast.error(msg);
    }
  };

  const handleRevokeKey = async () => {
    try {
      await sensorApi.revokeApiKey(sensorId);
      mutateSensor();
      toast.success('API Key revocada. El sensor ha quedado inactivo.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : common('error');
      toast.error(msg);
    }
  };

  const handleDeleteSensor = async () => {
    try {
      await sensorApi.delete(sensorId);
      toast.success('Sensor eliminado');
      router.push('/sensors');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : common('error');
      toast.error(msg);
    }
  };

  const handleCopyTopic = () => {
    if (!sensor) return;
    navigator.clipboard.writeText(sensor.mqttTopic);
    setCopiedTopic(true);
    setTimeout(() => setCopiedTopic(false), 2000);
  };

  if (isSensorLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!sensor) {
    return (
      <div className="p-12 text-center space-y-4">
        <p className="text-muted-foreground">Sensor no encontrado</p>
        <Button render={<Link href="/sensors" />} variant="outline">
          <span>{common('back')}</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-3 border-b">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button
              render={<Link href="/sensors" />}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">{sensor.name}</h1>
            <SensorStatusBadge status={sensor.status} />
          </div>
          <p className="text-xs text-muted-foreground pl-11">
            {sensor.description || 'Dispositivo sensor IoT'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowRotateDialog(true)}
            className="gap-1.5 text-xs h-8"
          >
            <RotateCw className="h-3.5 w-3.5" />
            <span>{t('rotateKey')}</span>
          </Button>

          {sensor.status === 'active' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRevokeDialog(true)}
              className="gap-1.5 text-xs h-8 text-amber-600 dark:text-amber-400 hover:text-amber-700"
            >
              <Ban className="h-3.5 w-3.5" />
              <span>{t('revokeKey')}</span>
            </Button>
          )}

          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
            className="gap-1.5 text-xs h-8"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>{common('delete')}</span>
          </Button>
        </div>
      </div>

      {/* Connection & MQTT Info Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                {t('mqttTopic')}
              </span>
              <p className="text-xs font-mono font-bold text-foreground truncate">
                {sensor.mqttTopic}
              </p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopyTopic}>
              {copiedTopic ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase">
                {t('apiKeyPrefix')}
              </span>
              <p className="text-xs font-mono font-bold text-foreground">
                {sensor.apiKeyPrefix}••••••••••••••••
              </p>
            </div>
            <div className="p-2 rounded-md bg-muted text-muted-foreground">
              <KeyRound className="h-4 w-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Tabs */}
      <Tabs defaultValue="chart" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-xl">
          <TabsTrigger value="chart" className="gap-2 text-xs">
            <Activity className="h-3.5 w-3.5" />
            <span>{t('chartTab')}</span>
          </TabsTrigger>
          <TabsTrigger value="digital-twin" className="gap-2 text-xs font-semibold text-purple-600 dark:text-purple-400">
            <Cpu className="h-3.5 w-3.5" />
            <span>Gemelo Digital</span>
          </TabsTrigger>
          <TabsTrigger value="table" className="gap-2 text-xs">
            <Table className="h-3.5 w-3.5" />
            <span>{t('tableTab')} ({allReadings.length})</span>
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2 text-xs">
            <Settings className="h-3.5 w-3.5" />
            <span>{t('settingsTab')}</span>
          </TabsTrigger>
        </TabsList>

        {/* Chart View */}
        <TabsContent value="chart" className="space-y-4">
          <SensorDataChart data={allReadings} sensorName={sensor.name} />
        </TabsContent>

        {/* Digital Twin View */}
        <TabsContent value="digital-twin" className="space-y-4">
          <PlanoInclinadoVisualizer sensorId={sensor.id} />
        </TabsContent>

        {/* Table View */}
        <TabsContent value="table" className="space-y-4">
          <SensorDataTable data={allReadings} />
        </TabsContent>

        {/* Settings View */}
        <TabsContent value="settings" className="space-y-4 max-w-xl">
          <SensorSettingsForm
            key={`${sensor.id}-${sensor.updatedAt || ''}`}
            sensor={sensor}
            onUpdated={mutateSensor}
            nameLabel={t('nameLabel')}
            descLabel={t('descLabel')}
            saveLabel={common('save')}
            errorLabel={common('error')}
          />
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialogs */}
      <ConfirmDialog
        open={showRotateDialog}
        onOpenChange={setShowRotateDialog}
        title={t('rotateKey')}
        description={t('rotateConfirm')}
        confirmLabel={t('rotateKey')}
        onConfirm={handleRotateKey}
      />

      <ConfirmDialog
        open={showRevokeDialog}
        onOpenChange={setShowRevokeDialog}
        title={t('revokeKey')}
        description={t('revokeConfirm')}
        confirmLabel={t('revokeKey')}
        variant="destructive"
        onConfirm={handleRevokeKey}
      />

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Eliminar Sensor"
        description="¿Estás seguro de eliminar este sensor y todo su historial de telemetría? Esta acción no se puede deshacer."
        confirmLabel={common('delete')}
        variant="destructive"
        onConfirm={handleDeleteSensor}
      />

      {/* Rotated Key Modal */}
      {rotatedKeyData && (
        <ApiKeyDisplayDialog
          open={showRotatedKeyModal}
          onOpenChange={setShowRotatedKeyModal}
          rawApiKey={rotatedKeyData.rawApiKey}
          sensorName={sensor.name}
          mqttTopic={sensor.mqttTopic}
        />
      )}
    </div>
  );
}
