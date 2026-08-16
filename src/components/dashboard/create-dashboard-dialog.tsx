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
import { Switch } from '@/components/ui/switch';
import { dashboardApi } from '@/lib/api/dashboards';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/routing';

const createDashboardSchema = z.object({
  name: z.string().min(2, { message: 'El nombre es obligatorio' }),
  description: z.string().optional(),
  isPublic: z.boolean(),
});

type CreateDashboardFormValues = z.infer<typeof createDashboardSchema>;

interface CreateDashboardDialogProps {
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function CreateDashboardDialog({ onSuccess, trigger }: CreateDashboardDialogProps) {
  const t = useTranslations('dashboards');
  const common = useTranslations('common');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    reset,
    formState: { errors },
  } = useForm<CreateDashboardFormValues>({
    resolver: zodResolver(createDashboardSchema),
    defaultValues: {
      name: '',
      description: '',
      isPublic: false,
    },
  });

  const isPublic = useWatch({ control, name: 'isPublic', defaultValue: false });

  const onSubmit = async (data: CreateDashboardFormValues) => {
    setIsLoading(true);
    try {
      const created = await dashboardApi.create({
        name: data.name,
        description: data.description || undefined,
        isPublic: data.isPublic,
      });

      setOpen(false);
      reset();
      if (onSuccess) onSuccess();
      toast.success('Tablero creado con éxito');
      router.push(`/dashboards/${created.id}`);
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
            <Button size="sm" className="gap-1.5 shadow-sm">
              <Plus className="h-4 w-4" />
              <span>{t('newDashboard')}</span>
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
            <Label htmlFor="dash-name">{t('nameLabel')}</Label>
            <Input
              id="dash-name"
              placeholder="ej: Planta Solar - Monitoreo Inversores"
              disabled={isLoading}
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dash-desc">{t('descLabel')}</Label>
            <Input
              id="dash-desc"
              placeholder="ej: Visualización de voltaje, corriente y temperatura"
              disabled={isLoading}
              {...register('description')}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
            <div className="space-y-0.5">
              <Label htmlFor="dash-public" className="text-xs font-semibold">
                {t('isPublicLabel')}
              </Label>
              <p className="text-[11px] text-muted-foreground">
                Permite que cualquier persona con el enlace vea los datos en vivo.
              </p>
            </div>
            <Switch
              id="dash-public"
              checked={isPublic}
              onCheckedChange={(val) => setValue('isPublic', val)}
              disabled={isLoading}
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
  );
}
