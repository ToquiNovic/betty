'use client';

import React, { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { useAuthStore } from '@/stores/auth-store';
import { authApi } from '@/lib/api/auth';
import { PageHeader } from '@/components/common/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useTheme } from 'next-themes';
import { User, Shield, Sun, Moon, Laptop, Languages, Loader2, Check } from 'lucide-react';
import { toast } from '@/lib/toast';

interface ProfileSettingsFormProps {
  user: NonNullable<ReturnType<typeof useAuthStore.getState>['user']>;
  onUpdated: (user: NonNullable<ReturnType<typeof useAuthStore.getState>['user']>) => void;
  title: string;
  desc: string;
  nameLabel: string;
  avatarUrlLabel: string;
  updateProfileLabel: string;
  errorLabel: string;
}

function ProfileSettingsForm({
  user,
  onUpdated,
  title,
  desc,
  nameLabel,
  avatarUrlLabel,
  updateProfileLabel,
  errorLabel,
}: ProfileSettingsFormProps) {
  const [name, setName] = useState(user.name);
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || '');
  const [isSaving, setIsSaving] = useState(false);

  const initials = user.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await authApi.updateProfile({
        name,
        avatarUrl: avatarUrl || undefined,
      });
      onUpdated(updated);
      toast.success('Perfil actualizado correctamente');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : errorLabel;
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader className="p-5 pb-3">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-primary" />
          <CardTitle className="text-base font-bold">{title}</CardTitle>
        </div>
        <CardDescription className="text-xs">{desc}</CardDescription>
      </CardHeader>
      <form onSubmit={handleUpdateProfile}>
        <CardContent className="p-5 pt-0 space-y-6">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={avatarUrl || ''} />
              <AvatarFallback className="text-lg bg-primary/10 text-primary font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="font-semibold text-sm">{user.name}</p>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{user.email}</span>
                {user.role === 'admin' && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    <Shield className="h-2.5 w-2.5 mr-1" />
                    Admin
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="user-name">{nameLabel}</Label>
              <Input
                id="user-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isSaving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user-avatar">{avatarUrlLabel}</Label>
              <Input
                id="user-avatar"
                placeholder="https://..."
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                disabled={isSaving}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-5 pt-0 border-t bg-muted/10 py-3 flex justify-end">
          <Button type="submit" size="sm" disabled={isSaving} className="gap-1.5">
            {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
            <span>{updateProfileLabel}</span>
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}

export default function SettingsPage() {
  const t = useTranslations('settings');
  const common = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user, setUser } = useAuthStore();

  const switchLocale = (newLocale: 'es' | 'en') => {
    router.replace(pathname, { locale: newLocale });
  };

  if (!user) return null;

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      {/* Profile Section */}
      <ProfileSettingsForm
        key={`${user.id}-${user.name}-${user.avatarUrl || ''}`}
        user={user}
        onUpdated={setUser}
        title={t('profileSection')}
        desc="Información personal y cómo apareces ante tus compañeros de equipo."
        nameLabel={t('nameLabel')}
        avatarUrlLabel={t('avatarUrlLabel')}
        updateProfileLabel={t('updateProfile')}
        errorLabel={common('error')}
      />

      {/* Appearance Section */}
      <Card className="border shadow-sm">
        <CardHeader className="p-5 pb-3">
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4 text-primary" />
            <CardTitle className="text-base font-bold">{t('appearanceSection')}</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Selecciona el tema de color para la interfaz de Betty.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <div className="grid grid-cols-3 gap-3 max-w-md">
            <Button
              type="button"
              variant={theme === 'light' ? 'default' : 'outline'}
              className="h-16 flex flex-col items-center justify-center gap-1.5 text-xs"
              onClick={() => setTheme('light')}
            >
              <Sun className="h-4 w-4" />
              <span>{t('themeLight')}</span>
            </Button>
            <Button
              type="button"
              variant={theme === 'dark' ? 'default' : 'outline'}
              className="h-16 flex flex-col items-center justify-center gap-1.5 text-xs"
              onClick={() => setTheme('dark')}
            >
              <Moon className="h-4 w-4" />
              <span>{t('themeDark')}</span>
            </Button>
            <Button
              type="button"
              variant={theme === 'system' ? 'default' : 'outline'}
              className="h-16 flex flex-col items-center justify-center gap-1.5 text-xs"
              onClick={() => setTheme('system')}
            >
              <Laptop className="h-4 w-4" />
              <span>{t('themeSystem')}</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Language Section */}
      <Card className="border shadow-sm">
        <CardHeader className="p-5 pb-3">
          <div className="flex items-center gap-2">
            <Languages className="h-4 w-4 text-primary" />
            <CardTitle className="text-base font-bold">{t('languageSection')}</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Selecciona tu idioma preferido para todos los textos de la plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <div className="grid grid-cols-2 gap-3 max-w-xs">
            <Button
              type="button"
              variant={locale === 'es' ? 'default' : 'outline'}
              className="justify-between text-xs h-10"
              onClick={() => switchLocale('es')}
            >
              <span>Español (ES)</span>
              {locale === 'es' && <Check className="h-4 w-4 ml-2" />}
            </Button>
            <Button
              type="button"
              variant={locale === 'en' ? 'default' : 'outline'}
              className="justify-between text-xs h-10"
              onClick={() => switchLocale('en')}
            >
              <span>English (EN)</span>
              {locale === 'en' && <Check className="h-4 w-4 ml-2" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
