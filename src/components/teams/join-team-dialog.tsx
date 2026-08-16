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
import { KeyRound, Loader2 } from 'lucide-react';
import { toast } from '@/lib/toast';
import { useRouter } from '@/i18n/routing';

const joinTeamSchema = z.object({
  code: z.string().min(6, { message: 'Ingresa un código válido' }),
});

type JoinTeamFormValues = z.infer<typeof joinTeamSchema>;

interface JoinTeamDialogProps {
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export function JoinTeamDialog({ onSuccess, trigger }: JoinTeamDialogProps) {
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
  } = useForm<JoinTeamFormValues>({
    resolver: zodResolver(joinTeamSchema),
  });

  const onSubmit = async (data: JoinTeamFormValues) => {
    setIsLoading(true);
    try {
      const res = await teamApi.joinByCode({ code: data.code.trim() });
      setOpen(false);
      reset();
      if (onSuccess) onSuccess();
      toast.success(res.message || 'Te has unido al equipo');
      router.push(`/teams/${res.team.id}`);
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
            <Button size="sm" variant="outline" className="gap-1.5 shadow-sm">
              <KeyRound className="h-4 w-4" />
              <span>{t('joinTeam')}</span>
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">{t('joinWithCodeTitle')}</DialogTitle>
          <DialogDescription>{t('joinWithCodeDesc')}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="team-code">Código de 8 Caracteres</Label>
            <Input
              id="team-code"
              placeholder={t('codePlaceholder')}
              className="font-mono text-center text-lg tracking-widest uppercase"
              disabled={isLoading}
              maxLength={16}
              {...register('code')}
            />
            {errors.code && (
              <p className="text-xs text-destructive">{errors.code.message}</p>
            )}
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
              {t('joinButton')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
