'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useRouter, Link } from '@/i18n/routing';
import { teamApi } from '@/lib/api/teams';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function JoinTeamPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');

  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [autoJoining, setAutoJoining] = useState(() => Boolean(token));

  useEffect(() => {
    if (token) {
      let isMounted = true;
      const joinWithToken = async () => {
        try {
          const res = await teamApi.joinByToken(token);
          if (isMounted) {
            toast.success(res.message || 'Te has unido al equipo');
            router.replace(`/teams/${res.team.id}`);
          }
        } catch (err: unknown) {
          if (isMounted) {
            const msg = err instanceof Error ? err.message : 'Enlace de invitación inválido o expirado';
            toast.error(msg);
            setAutoJoining(false);
          }
        }
      };

      joinWithToken();
      return () => {
        isMounted = false;
      };
    }
  }, [token, router]);

  const handleJoinByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setIsLoading(true);
    try {
      const res = await teamApi.joinByCode({ code: code.trim() });
      toast.success(res.message || 'Te has unido al equipo');
      router.push(`/teams/${res.team.id}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Código de invitación inválido';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (autoJoining) {
    return (
      <div className="max-w-md mx-auto py-16">
        <Card className="border shadow-sm text-center p-8 space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-sm font-medium">Validando enlace de invitación y uniéndote al equipo...</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-10 space-y-4">
      <Button
        render={<Link href="/teams" />}
        variant="ghost"
        size="sm"
        className="gap-1.5 text-xs"
      >
        <ArrowLeft className="h-4 w-4" />
        <span>Volver a Equipos</span>
      </Button>

      <Card className="border shadow-sm">
        <CardHeader className="text-center space-y-1.5">
          <div className="mx-auto p-3 rounded-full bg-primary/10 text-primary w-fit">
            <Users className="h-6 w-6" />
          </div>
          <CardTitle className="text-xl font-bold">Unirse a un Equipo</CardTitle>
          <CardDescription className="text-xs">
            Ingresa el código alfanumérico de 8 caracteres que te proporcionó el propietario del equipo.
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleJoinByCode}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="join-code">Código de Invitación</Label>
              <Input
                id="join-code"
                placeholder="ej: A8B2C4D6"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="font-mono text-center text-lg tracking-widest uppercase"
                maxLength={16}
                disabled={isLoading}
              />
            </div>
          </CardContent>

          <CardFooter>
            <Button type="submit" className="w-full gap-2" disabled={isLoading || !code.trim()}>
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>Unirse al Equipo</span>
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
