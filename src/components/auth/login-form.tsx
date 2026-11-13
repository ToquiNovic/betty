"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useRouter } from "@/i18n/routing";
import { useAuthStore } from "@/stores/auth-store";
import { Loader2, AlertTriangle, LogIn } from "lucide-react";

export function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  const error = searchParams.get("error");

  useEffect(() => {
    if (isAuthenticated && user) {
      router.replace("/overview");
    }
  }, [isAuthenticated, user, router]);

  const handleSignIn = () => {
    if (isLoading) return;
    setIsLoading(true);

    let apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";
    if (
      typeof window !== "undefined" &&
      window.location.hostname.includes("laboratorio3d.online")
    ) {
      apiUrl = "https://betty-api.laboratorio3d.online/api";
    }

    window.location.href = `${apiUrl}/auth/ua3d`;
  };

  const getErrorMessage = (code: string | null) => {
    if (!code) return null;
    if (code === "ua3d_code_missing") return "Código de autorización ausente.";
    if (code === "ua3d_token_exchange_failed")
      return "Fallo en el intercambio de credenciales con Keycloak.";
    if (code === "ua3d_userinfo_failed")
      return "No se pudo recuperar la identidad del usuario.";
    if (code === "OAuthCallback" || code === "ua3d_login_error")
      return "Error al procesar el inicio de sesión institucional.";
    return `Error de autenticación (${code}). Intenta de nuevo.`;
  };

  return (
    <div className="relative w-full max-w-sm mx-auto">
      {/* Background glow decorations matching Distro */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 w-full glass-panel p-8 sm:p-10 rounded-3xl border border-border shadow-2xl shadow-black/20 text-center space-y-6 bg-card/80 backdrop-blur-md">
        {/* Institutional UA Logo */}
        <div className="w-16 h-16 rounded-2xl bg-secondary/80 border border-border flex items-center justify-center mx-auto p-2 shadow-sm animate-pulse">
          <img
            src="/ua-logo.png"
            alt="Escudo Universidad de la Amazonia"
            className="w-full h-full object-contain"
          />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center justify-center gap-1.5">
            Botuto & UA3D Platform
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          </h1>
          <p className="text-xs text-muted-foreground">
            Iniciando sesión segura con el Campus Virtual...
          </p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs flex items-center gap-2 text-left">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{getErrorMessage(error)}</span>
          </div>
        )}

        <div className="space-y-4">
          <button
            type="button"
            onClick={handleSignIn}
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-600/20 cursor-pointer"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Conectando con el Campus Virtual...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Iniciar Sesión Institucional</span>
              </>
            )}
          </button>
        </div>

        <div className="pt-2 text-[10px] font-mono text-muted-foreground/60">
          Investigación Metaversos UDLA &bull; Gemelos Digitales IoT
        </div>
      </div>
    </div>
  );
}
