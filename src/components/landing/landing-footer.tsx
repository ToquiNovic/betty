'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Activity, Globe, FileCode, ExternalLink } from 'lucide-react';
import { Link } from '@/i18n/routing';

export function LandingFooter() {
  const t = useTranslations('landing');
  const common = useTranslations('common');

  return (
    <footer className="border-t border-border/60 bg-muted/40 py-14">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-border/50">
          {/* Column 1: Brand & Bio */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-indigo-600 to-cyan-500 text-white shadow-sm">
                <Activity className="h-4 w-4" />
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg tracking-tight text-foreground">
                  {common('appName')}
                </span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 leading-none">
                  v1.0
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
              {common('appTagline')}. Arquitectura unificada para telemetría física y simulaciones en mundos virtuales con almacenamiento en series temporales.
            </p>
          </div>

          {/* Column 2: Platform Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Plataforma
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link href="/explore" className="hover:text-foreground transition-colors flex items-center gap-1">
                  <Globe className="h-3 w-3 text-cyan-500" />
                  <span>Explorar Dashboards Públicos</span>
                </Link>
              </li>
              <li>
                <Link href="/register" className="hover:text-foreground transition-colors">
                  Registrar Dispositivo
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-foreground transition-colors">
                  Acceso a la Consola
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Tech & Docs */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Desarrolladores & API
            </h4>
            <ul className="space-y-2 text-xs text-muted-foreground">
              <li>
                <Link
                  href="/docs"
                  className="hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <FileCode className="h-3 w-3 text-primary" />
                  <span>Documentación Developers</span>
                </Link>
              </li>
              <li>
                <a
                  href="http://localhost:18083"
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-foreground transition-colors flex items-center gap-1"
                >
                  <Activity className="h-3 w-3 text-emerald-500" />
                  <span>EMQX Broker Dashboard</span>
                  <ExternalLink className="h-2.5 w-2.5 ml-0.5 opacity-60" />
                </a>
              </li>
              <li>
                <span className="text-[11px] font-mono text-muted-foreground/80">
                  MQTT Ingest: TCP 1883
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright and legal */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>
            {t('footerText')} © {new Date().getFullYear()}
          </p>

          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1 text-[11px] font-mono text-muted-foreground/90">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Sistemas Operativos
            </span>
            <span className="text-muted-foreground/40">•</span>
            <span>Licencia MIT</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
