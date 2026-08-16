'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { sensorApi } from '@/lib/api/sensors';
import { useTeams } from '@/lib/api/teams';
import { ApiKeyDisplayDialog } from './api-key-display';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from '@/lib/toast';
import { CreateSensorResponse } from '@/types';

const createSensorSchema = z.object({
  name: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }),
  description: z.string().optional(),
  teamId: z.string().optional(),
  metadataJson: z.string().optional(),
});

type CreateSensorFormValues = z.infer<typeof createSensorSchema>;

interface CreateSensorDialogProps {
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function CreateSensorDialog({ onSuccess, trigger }: CreateSensorDialogProps) {
  const t = useTranslations('sensors');
  const common = useTranslations('common');
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [createdData, setCreatedData] = useState<CreateSensorResponse | null>(null);
  const [showKeyDialog, setShowKeyDialog] = useState(false);

  const { teams } = useTeams();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CreateSensorFormValues>({
    resolver: zodResolver(createSensorSchema),
    defaultValues: {
      teamId: 'personal',
    },
  });

  const onSubmit = async (data: CreateSensorFormValues) => {
    setIsLoading(true);
    try {
      let parsedMetadata: Record<string, unknown> | undefined;
      if (data.metadataJson?.trim()) {
        try {
          parsedMetadata = JSON.parse(data.metadataJson);
        } catch {
          toast.error('El formato de los metadatos JSON es inválido.');
          setIsLoading(false);
          return;
        }
      }

      const response = await sensorApi.create({
        name: data.name,
        description: data.description || undefined,
        teamId: data.teamId === 'personal' ? undefined : data.teamId,
        metadata: parsedMetadata,
      });

      setCreatedData(response);
      setOpen(false);
      reset();
      setShowKeyDialog(true);
      if (onSuccess) onSuccess();
      toast.success('Sensor registrado con éxito');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : common('error');
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger
          render={
            trigger ? (
              (trigger as React.ReactElement)
            ) : (
              <Button size="sm" className="gap-1.5 shadow-sm">
                <Plus className="h-4 w-4" />
                <span>{t('newSensor')}</span>
              </Button>
            )
          }
        />
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{t('createDialogTitle')}</DialogTitle>
            <DialogDescription>{t('createDialogDesc')}</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="sensor-name">{t('nameLabel')}</Label>
              <Input
                id="sensor-name"
                placeholder="ej: Sensor Temperatura Edificio A"
                disabled={isLoading}
                {...register('name')}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="sensor-desc">{t('descLabel')}</Label>
              <Input
                id="sensor-desc"
                placeholder="ej: Monitoreo ambiental en planta baja"
                disabled={isLoading}
                {...register('description')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sensor-team">{t('teamLabel')}</Label>
              <Select
                defaultValue="personal"
                onValueChange={(val) => setValue('teamId', val || undefined)}
                disabled={isLoading}
              >
                <SelectTrigger id="sensor-team">
                  <SelectValue placeholder={t('personalSensor')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">{t('personalSensor')}</SelectItem>
                  {(teams || []).map((membership) => {
                    const teamId = membership.teamId || membership.team?.id;
                    const teamName = membership.teamName || membership.team?.name || 'Equipo';
                    if (!teamId) return null;
                    return (
                      <SelectItem key={teamId} value={teamId}>
                        {teamName}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="sensor-meta">Metadatos iniciales (JSON opcional)</Label>
              <Textarea
                id="sensor-meta"
                placeholder='{ "location": "Piso 2", "hardware": "ESP32", "firmware": "v1.2.0" }'
                className="font-mono text-xs h-20"
                disabled={isLoading}
                {...register('metadataJson')}
              />
            </div>

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

      {createdData && (
        <ApiKeyDisplayDialog
          open={showKeyDialog}
          onOpenChange={setShowKeyDialog}
          rawApiKey={createdData.rawApiKey}
          sensorName={createdData.name}
          mqttTopic={createdData.mqttTopic}
        />
      )}
    </>
  );
}
