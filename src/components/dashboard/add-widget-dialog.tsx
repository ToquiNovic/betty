'use client';

import React, { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSensors } from '@/lib/api/sensors';
import { dashboardApi } from '@/lib/api/dashboards';
import { WidgetType } from '@/types';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from '@/lib/toast';

const addWidgetSchema = z.object({
  sensorId: z.string().min(1, { message: 'Selecciona un sensor' }),
  widgetType: z.enum(['line_chart', 'gauge', 'table', 'map', 'metric', 'bar_chart']),
  title: z.string().min(2, { message: 'El título es obligatorio' }),
  metricKey: z.string().optional(),
  unit: z.string().optional(),
  min: z.string().optional(),
  max: z.string().optional(),
  latKey: z.string().optional(),
  lngKey: z.string().optional(),
});

type AddWidgetFormValues = z.infer<typeof addWidgetSchema>;

interface AddWidgetDialogProps {
  dashboardId: string;
  onSuccess: () => void;
  trigger?: React.ReactNode;
}

export function AddWidgetDialog({ dashboardId, onSuccess, trigger }: AddWidgetDialogProps) {
  const t = useTranslations('dashboards');
  const common = useTranslations('common');
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { sensors } = useSensors();

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<AddWidgetFormValues>({
    resolver: zodResolver(addWidgetSchema),
    defaultValues: {
      sensorId: '',
      widgetType: 'line_chart',
      title: '',
      metricKey: 'value',
      min: '0',
      max: '100',
      latKey: 'lat',
      lngKey: 'lng',
    },
  });

  const selectedType = useWatch({ control, name: 'widgetType', defaultValue: 'line_chart' });

  const onSubmit = async (data: AddWidgetFormValues) => {
    setIsLoading(true);
    try {
      await dashboardApi.addWidget(dashboardId, {
        sensorId: data.sensorId,
        widgetType: data.widgetType as WidgetType,
        title: data.title,
        config: {
          metricKey: data.metricKey || 'value',
          unit: data.unit || undefined,
          min: data.min ? Number(data.min) : undefined,
          max: data.max ? Number(data.max) : undefined,
          latKey: data.latKey || 'lat',
          lngKey: data.lngKey || 'lng',
        },
        position: {
          x: 0,
          y: 0,
          w: data.widgetType === 'table' || data.widgetType === 'line_chart' ? 6 : 4,
          h: data.widgetType === 'line_chart' || data.widgetType === 'map' ? 3 : 2,
        },
      });

      setOpen(false);
      reset();
      onSuccess();
      toast.success('Widget añadido al dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : common('error');
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ? (
            (trigger as React.ReactElement)
          ) : (
            <Button size="sm" variant="outline" className="gap-1.5 h-8 text-xs font-semibold">
              <Plus className="h-4 w-4" />
              <span>{t('addWidget')}</span>
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{t('addWidget')}</DialogTitle>
          <DialogDescription>
            Configura el tipo de visualización y el sensor de origen.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="widget-sensor">{t('selectSensor')}</Label>
            <Select onValueChange={(val: string | null) => { if (val) setValue('sensorId', val); }}>
              <SelectTrigger id="widget-sensor">
                <SelectValue placeholder="Seleccionar un sensor..." />
              </SelectTrigger>
              <SelectContent>
                {sensors.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name} ({s.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.sensorId && (
              <p className="text-xs text-destructive">{errors.sensorId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="widget-type">{t('widgetType')}</Label>
            <Select
              defaultValue="line_chart"
              onValueChange={(val: string | null) => { if (val) setValue('widgetType', val as WidgetType); }}
            >
              <SelectTrigger id="widget-type">
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="line_chart">{t('typeLineChart')}</SelectItem>
                <SelectItem value="bar_chart">{t('typeBarChart')}</SelectItem>
                <SelectItem value="gauge">{t('typeGauge')}</SelectItem>
                <SelectItem value="metric">{t('typeMetric')}</SelectItem>
                <SelectItem value="table">{t('typeTable')}</SelectItem>
                <SelectItem value="map">{t('typeMap')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="widget-title">{t('widgetTitle')}</Label>
            <Input
              id="widget-title"
              placeholder="ej: Monitoreo Temperatura Actual"
              disabled={isLoading}
              {...register('title')}
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          {selectedType !== 'map' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="widget-metric">{t('metricKey')}</Label>
                <Input
                  id="widget-metric"
                  placeholder="ej: temperature, value"
                  className="font-mono text-xs"
                  disabled={isLoading}
                  {...register('metricKey')}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="widget-unit">{t('unitLabel')}</Label>
                <Input
                  id="widget-unit"
                  placeholder="ej: °C, %, rpm"
                  disabled={isLoading}
                  {...register('unit')}
                />
              </div>
            </div>
          )}

          {selectedType === 'gauge' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="widget-min">{t('minVal')}</Label>
                <Input
                  id="widget-min"
                  type="number"
                  placeholder="0"
                  disabled={isLoading}
                  {...register('min')}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="widget-max">{t('maxVal')}</Label>
                <Input
                  id="widget-max"
                  type="number"
                  placeholder="100"
                  disabled={isLoading}
                  {...register('max')}
                />
              </div>
            </div>
          )}

          {selectedType === 'map' && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="widget-lat">Campo Latitud</Label>
                <Input
                  id="widget-lat"
                  placeholder="lat"
                  className="font-mono text-xs"
                  disabled={isLoading}
                  {...register('latKey')}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="widget-lng">Campo Longitud</Label>
                <Input
                  id="widget-lng"
                  placeholder="lng"
                  className="font-mono text-xs"
                  disabled={isLoading}
                  {...register('lngKey')}
                />
              </div>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              {common('cancel')}
            </Button>
            <Button type="submit" disabled={isLoading} className="gap-2">
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {common('create')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
