'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import { authApi } from '@/lib/api/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { toast } from '@/lib/toast';
import { Loader2, ArrowLeft } from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>;

export function ForgotPasswordForm() {
  const t = useTranslations('auth');
  const common = useTranslations('common');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    setIsLoading(true);
    try {
      await authApi.forgotPassword(data);
      setIsSubmitted(true);
      toast.success(t('resetLinkSent'));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : common('error');
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-lg border">
      <CardHeader className="space-y-1.5 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">
          {t('forgotPasswordTitle')}
        </CardTitle>
        <CardDescription className="text-sm">
          {t('forgotPasswordSubtitle')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isSubmitted ? (
          <div className="p-4 bg-muted rounded-lg text-sm text-center text-muted-foreground space-y-2">
            <p>{t('resetLinkSent')}</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t('emailLabel')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                disabled={isLoading}
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full h-10 font-semibold" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('sendResetLink')}
            </Button>
          </form>
        )}
      </CardContent>
      <CardFooter className="flex justify-center border-t py-4 text-xs text-muted-foreground">
        <Link href="/login" className="flex items-center gap-1.5 text-foreground hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>{common('back')}</span>
        </Link>
      </CardFooter>
    </Card>
  );
}
