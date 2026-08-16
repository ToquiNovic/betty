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
import { teamApi } from '@/lib/api/teams';
import { Plus, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/routing';

const createTeamSchema = z.object({
  name: z.string().min(2, { message: 'El nombre es obligatorio' }),
  description: z.string().optional(),
});

type CreateTeamFormValues = z.infer<typeof createTeamSchema>;

interface CreateTeamDialogProps {
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function CreateTeamDialog({ onSuccess, trigger }: CreateTeamDialogProps) {
  const t = useTranslations('teams');
  const common = useTranslations('common');
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateTeamFormValues>({
    resolver: zodResolver(createTeamSchema),
  });

  const onSubmit = async (data: CreateTeamFormValues) => {
    setIsLoading(true);
    try {
      const created = await teamApi.create({
        name: data.name,
        description: data.description || undefined,
      });

      setOpen(false);
      reset();
      if (onSuccess) onSuccess();
      toast.success('Equipo creado con éxito');
      router.push(`/teams/${created.id}`);
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
              <span>{t('newTeam')}</span>
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
            <Label htmlFor="team-name">{t('nameLabel')}</Label>
            <Input
              id="team-name"
              placeholder="ej: Laboratorio de Robótica y Gemelos"
              disabled={isLoading}
              {...register('name')}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="team-desc">{t('descLabel')}</Label>
            <Input
              id="team-desc"
              placeholder="ej: Monitoreo conjunto de telemetría y sensores"
              disabled={isLoading}
              {...register('description')}
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
