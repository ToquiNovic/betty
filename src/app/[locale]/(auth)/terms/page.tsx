'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, Link } from '@/i18n/routing';
import { useAuthStore } from '@/stores/auth-store';
import { authApi } from '@/lib/api/auth';
import { toast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import {
  AlertTriangle,
  CheckCircle2,
  FileText,
  Loader2,
  LogOut,
  ArrowRight,
  ShieldCheck,
  Download,
  GraduationCap,
  Mail,
  Phone,
  HelpCircle,
  Check,
  X,
} from 'lucide-react';

export default function TermsPage() {
  const t = useTranslations('terms');
  const common = useTranslations('common');
  const router = useRouter();
  const { user, isAuthenticated, isHydrated, setUser, logout } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Mandatory Consent Questions: C1 and C2
  const [c1Accepted, setC1Accepted] = useState(false); // C1. Participación voluntaria
  const [c2Accepted, setC2Accepted] = useState(false); // C2. Autorización de tratamiento de respuestas

  useEffect(() => {
    if (user?.dataConsentAccepted || user?.termsAccepted) {
      setC1Accepted(true);
      setC2Accepted(true);
    }
  }, [user]);

  const isPendingAcceptance = Boolean(isAuthenticated && user && !user.termsAccepted);
  const isAlreadyAccepted = Boolean(isAuthenticated && user && user.termsAccepted);
  const canProceed = c1Accepted && c2Accepted;

  const handleAccept = async () => {
    if (!canProceed) {
      toast.error('Debes responder afirmativamente a C1 y C2 para continuar.');
      return;
    }

    setIsSubmitting(true);
    try {
      const updatedUser = await authApi.acceptTerms({
        termsAccepted: true,
        dataConsentAccepted: true,
        allowPhotos: false,
        allowAudio: false,
        allowVideo: false,
      });
      setUser(updatedUser);
      toast.success('¡Consentimiento y autorización de datos registrados con éxito!');
      router.push('/overview');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : common('error');
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const formattedDate = user?.dataConsentAcceptedAt
    ? new Date(user.dataConsentAcceptedAt).toLocaleDateString()
    : user?.termsAcceptedAt
    ? new Date(user.termsAcceptedAt).toLocaleDateString()
    : null;

  return (
    <div className="auth-container-wide w-full py-4 space-y-4">
      <Card className="shadow-xl border border-border/80 overflow-hidden backdrop-blur-sm">
        <div className="h-1.5 w-full bg-linear-to-r from-emerald-500 via-teal-400 to-primary" />

        <CardHeader className="space-y-2 text-center pb-4">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-1">
            <ShieldCheck className="h-6 w-6 text-emerald-500" />
          </div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 mx-auto">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            Presentación y Consentimiento Informado • Ley 1581 de 2012
          </div>
          <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight">
            Áreas estratégicas y oportunidades de desarrollo tecnológico en Florencia, Piedemonte Amazónico
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground max-w-lg mx-auto">
            UNADE • Universidad Americana de Europa (<a href="https://unade.edu.mx/" target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:underline">https://unade.edu.mx/</a>)
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Notification Banners */}
          {isHydrated && isPendingAcceptance && (
            <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3.5 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
              <p className="leading-relaxed font-medium">
                Para acceder a la plataforma y participar en la investigación, por favor lea la información del estudio y complete las declaraciones obligatorias (C1 y C2).
              </p>
            </div>
          )}

          {isHydrated && isAlreadyAccepted && (
            <div className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-3.5 text-xs text-emerald-700 dark:text-emerald-300 flex items-start justify-between gap-2.5">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                <div>
                  <p className="leading-relaxed font-medium">
                    Ya has otorgado tu consentimiento informado para el estudio.
                  </p>
                  {formattedDate && (
                    <p className="text-[11px] opacity-80 mt-0.5">
                      Registrado el {formattedDate}
                    </p>
                  )}
                </div>
              </div>
              <Link
                href="/settings/consent-certificate"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 text-xs font-semibold shrink-0 transition-all"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Ver Constancia (PDF)</span>
              </Link>
            </div>
          )}

          {/* Adapted Legal and Study Text */}
          <div className="rounded-xl border border-border/60 bg-muted/20 p-4 sm:p-5 max-h-[320px] overflow-y-auto space-y-4 text-xs leading-relaxed text-muted-foreground">
            <section className="space-y-1.5">
              <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-emerald-500" />
                1. Propósito y Contexto del Estudio
              </h3>
              <p>
                Este cuestionario hace parte de una investigación académica sobre ciencia, tecnología e innovación en el Piedemonte Amazónico. Su propósito es conocer las capacidades, necesidades y barreras de las organizaciones de Florencia, Caquetá, y recoger su opinión sobre las áreas estratégicas de desarrollo tecnológico para el territorio:
              </p>
              <div className="p-2.5 rounded-xl bg-background/60 border border-border/60 text-[11px] text-foreground font-medium grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2">
                <div>• Inteligencia Artificial (IA)</div>
                <div>• Transformación Digital</div>
                <div>• Tecnologías Educativas (EdTech)</div>
                <div>• Bioeconomía</div>
                <div>• Turismo de Naturaleza</div>
                <div>• Producción Agropecuaria Inteligente</div>
                <div>• Biodiversidad</div>
                <div>• Energías Sostenibles</div>
                <div className="sm:col-span-2">• Internet de las Cosas (IoT)</div>
              </div>
            </section>

            <section className="space-y-1.5">
              <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-emerald-500" />
                2. Población Objetivo & Responsable
              </h3>
              <p>
                <strong>Población objetivo:</strong> Representantes de instituciones de educación superior y centros de investigación, entidades públicas, empresas, unidades productivas, organizaciones sociales y comunitarias con actividad en Florencia o su área de influencia.
              </p>
              <div className="p-2.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-[11px] space-y-1 mt-1 text-emerald-900 dark:text-emerald-200">
                <p>
                  <strong>Responsable del estudio:</strong> Freylen Rodolfo Ceballes Paloma (UNADE • <a href="https://unade.edu.mx/" target="_blank" rel="noopener noreferrer" className="text-emerald-500 hover:underline">https://unade.edu.mx/</a>).
                </p>
                <p className="flex items-center gap-3 flex-wrap">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-emerald-500" /> f.ceballes@udla.edu.co
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone className="w-3 h-3 text-emerald-500" /> 3217282646
                  </span>
                </p>
              </div>
            </section>

            <section className="space-y-1.5">
              <h3 className="font-semibold text-foreground text-sm flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-500" />
                3. Participación Voluntaria y Tratamiento de Datos (Ley 1581 de 2012)
              </h3>
              <p>
                <strong>Participación voluntaria:</strong> Puede dejar de responder cualquier pregunta o retirarse en cualquier momento, sin consecuencia alguna.
              </p>
              <p>
                <strong>Datos recogidos & Sensibles:</strong> No se solicita nombre ni cédula obligatorios en el cuestionario base. Preguntas sobre género y pertenencia étnica son facultativas. Las respuestas se analizarán de forma agregada para fines académicos y publicación en libro. Custodia por 1 año.
              </p>
            </section>
          </div>

          {/* Form Questions C1 and C2 */}
          <div className="space-y-4 p-4 rounded-xl bg-muted/40 border border-border">
            <h4 className="font-semibold text-xs text-foreground uppercase tracking-wider flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              Declaraciones y Preguntas de Consentimiento Obligatorias
            </h4>

            {/* Question C1 */}
            <div className="p-3.5 rounded-xl bg-background border border-border space-y-2">
              <label className="text-xs font-semibold text-foreground block">
                C1. Después de leer esta información, ¿acepta participar voluntariamente en el estudio? <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setC1Accepted(true)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                    c1Accepted
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500'
                      : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <span>Sí, acepto participar</span>
                  {c1Accepted && <Check className="w-4 h-4 text-emerald-500" />}
                </button>
                <button
                  type="button"
                  onClick={() => setC1Accepted(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                    !c1Accepted
                      ? 'bg-rose-500/10 border-rose-500 text-rose-500'
                      : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <span>No acepto participar</span>
                  {!c1Accepted && <X className="w-4 h-4 text-rose-500" />}
                </button>
              </div>
            </div>

            {/* Question C2 */}
            <div className="p-3.5 rounded-xl bg-background border border-border space-y-2">
              <label className="text-xs font-semibold text-foreground block">
                C2. ¿Autoriza el tratamiento de sus respuestas en las condiciones descritas (Ley 1581 de 2012)? <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setC2Accepted(true)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                    c2Accepted
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500'
                      : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <span>Sí, autorizo</span>
                  {c2Accepted && <Check className="w-4 h-4 text-emerald-500" />}
                </button>
                <button
                  type="button"
                  onClick={() => setC2Accepted(false)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                    !c2Accepted
                      ? 'bg-rose-500/10 border-rose-500 text-rose-500'
                      : 'bg-muted/40 border-border text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <span>No autorizo</span>
                  {!c2Accepted && <X className="w-4 h-4 text-rose-500" />}
                </button>
              </div>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 border-t border-border/50 pt-4 bg-muted/10">
          {isAuthenticated ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="w-full sm:w-auto text-xs text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-3.5 w-3.5 mr-1.5" />
              <span>{common('logout')}</span>
            </Button>
          ) : (
            <Link
              href="/login"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Volver al inicio de sesión
            </Link>
          )}

          <Button
            size="sm"
            onClick={handleAccept}
            disabled={!canProceed || isSubmitting}
            className="w-full sm:w-auto text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                <span>Registrando Consentimiento...</span>
              </>
            ) : (
              <>
                <span>Registrar Consentimiento y Continuar</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
              </>
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
