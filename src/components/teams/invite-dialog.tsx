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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { teamApi } from '@/lib/api/teams';
import { UserPlus, Copy, Check, Link as LinkIcon, Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const emailSchema = z.object({
  email: z.string().email({ message: 'Ingresa un email válido' }),
});

type EmailFormValues = z.infer<typeof emailSchema>;

interface InviteDialogProps {
  teamId: string;
  inviteCode: string;
  trigger?: React.ReactNode;
}

export function InviteDialog({ teamId, inviteCode, trigger }: InviteDialogProps) {
  const t = useTranslations('teams');
  const common = useTranslations('common');
  const [open, setOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [isSendingEmail, setIsSendingEmail] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
  });

  const handleCopyCode = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleGenerateLink = async () => {
    setIsGeneratingLink(true);
    try {
      const res = await teamApi.createInviteLink(teamId);
      const fullUrl = `${window.location.origin}/teams/join?token=${res.inviteToken}`;
      setGeneratedLink(fullUrl);
      navigator.clipboard.writeText(fullUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
      toast.success('Enlace de invitación generado y copiado (Válido por 7 días)');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : common('error');
      toast.error(msg);
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const onSendEmail = async (data: EmailFormValues) => {
    setIsSendingEmail(true);
    try {
      await teamApi.inviteByEmail(teamId, { email: data.email });
      reset();
      toast.success(`Invitación enviada por correo a ${data.email}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : common('error');
      toast.error(msg);
    } finally {
      setIsSendingEmail(false);
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
              <UserPlus className="h-4 w-4" />
              <span>Invitar Miembros</span>
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-md space-y-4">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Invitar al Equipo</DialogTitle>
          <DialogDescription>
            Comparte el código rápido, genera un enlace temporal o envía una invitación por correo.
          </DialogDescription>
        </DialogHeader>

        {/* Option 1: 8-char Code */}
        <div className="space-y-1.5">
          <Label className="text-xs font-semibold text-muted-foreground uppercase">
            Código Alfanumérico
          </Label>
          <div className="flex gap-2">
            <Input
              readOnly
              value={inviteCode}
              className="font-mono text-center font-bold tracking-widest bg-muted text-sm"
            />
            <Button variant="outline" size="icon" onClick={handleCopyCode}>
              {copiedCode ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        <Separator />

        {/* Option 2: 7-day secure link */}
        <div className="space-y-2">
          <Label className="text-xs font-semibold text-muted-foreground uppercase">
            Enlace de Invitación Seguro (7 días)
          </Label>
          {generatedLink ? (
            <div className="flex gap-2">
              <Input
                readOnly
                value={generatedLink}
                className="font-mono text-xs bg-muted truncate"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  navigator.clipboard.writeText(generatedLink);
                  setCopiedLink(true);
                  setTimeout(() => setCopiedLink(false), 2000);
                }}
              >
                {copiedLink ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2 text-xs h-9 font-medium"
              onClick={handleGenerateLink}
              disabled={isGeneratingLink}
            >
              {isGeneratingLink ? <Loader2 className="h-4 w-4 animate-spin" /> : <LinkIcon className="h-4 w-4" />}
              <span>{t('generateLink')}</span>
            </Button>
          )}
        </div>

        <Separator />

        {/* Option 3: Direct Email */}
        <form onSubmit={handleSubmit(onSendEmail)} className="space-y-3">
          <Label htmlFor="invite-email" className="text-xs font-semibold text-muted-foreground uppercase">
            {t('inviteByEmail')}
          </Label>
          <div className="flex gap-2">
            <Input
              id="invite-email"
              type="email"
              placeholder="colega@universidad.edu"
              disabled={isSendingEmail}
              className="text-xs"
              {...register('email')}
            />
            <Button type="submit" size="sm" disabled={isSendingEmail} className="gap-1.5 text-xs shrink-0">
              {isSendingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
              <span>Enviar</span>
            </Button>
          </div>
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
