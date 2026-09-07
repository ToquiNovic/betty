"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslations } from "next-intl";
import { useRouter, Link } from "@/i18n/routing";
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/stores/auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { GoogleAuthButton } from "./google-auth-button";
import { Ua3dAuthButton } from "./ua3d-auth-button";
import { toast } from "@/lib/toast";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().min(1, "Ingresa tu correo electrónico o usuario"),
  password: z.string().min(1, "Ingresa tu contraseña"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const t = useTranslations("auth");
  const common = useTranslations("common");
  const router = useRouter();
  const { login } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showLocalAuth, setShowLocalAuth] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    try {
      const email = data.email.includes("@")
        ? data.email.trim()
        : `${data.email.trim()}@betty.local`;
      const response = await authApi.login({ ...data, email });
      login(response);
      toast.success(t("loginSuccess"));
      router.push("/overview");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : common("error");
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-xl border border-border/80 overflow-hidden backdrop-blur-sm">
      <div className="h-1.5 w-full bg-linear-to-r from-emerald-500 via-teal-400 to-primary" />
      <CardHeader className="space-y-2 text-center pb-4">
        <div className="mx-auto w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500 mb-1">
          <span className="font-mono text-xl font-black">UA</span>
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight">
          {t("ssoTitle")}
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground max-w-sm mx-auto">
          {t("ssoDescription")}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Primary Unified Authentication Action */}
        <div className="space-y-3 p-1 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
          <Ua3dAuthButton />
        </div>

        <div className="rounded-lg bg-muted/40 p-3 text-[11px] text-muted-foreground space-y-1.5 border border-border/50">
          <p className="font-semibold text-foreground flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Acceso con Cuentas de la Grid (Keycloak SSO):
          </p>
          <p>
            • <strong>Administrador:</strong> usuario <code>admin</code> |
            contraseña <code>admin</code>
          </p>
          <p>
            • <strong>Operador / Avatar:</strong> usuario <code>operator</code>{" "}
            o tu avatar de OpenSim
          </p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium pt-0.5">
            💡 Haz clic en el botón verde superior para acceder directamente con
            estas credenciales.
          </p>
        </div>

        {/* Collapsible Local & Social Auth Toggle */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setShowLocalAuth(!showLocalAuth)}
            className="w-full text-center text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1"
          >
            <span>
              {showLocalAuth
                ? "Ocultar opciones secundarias"
                : "Más opciones de acceso (Google / Local)"}
            </span>
            <span className="text-[10px]">{showLocalAuth ? "▲" : "▼"}</span>
          </button>
        </div>

        {showLocalAuth && (
          <div className="space-y-4 pt-2 border-t border-border/50 animate-in fade-in-50 duration-200">
            <GoogleAuthButton />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-[10px] uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                  {t("orContinueWith")}
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-xs">
                  {t("emailLabel")} o Usuario
                </Label>
                <Input
                  id="email"
                  type="text"
                  placeholder="admin o admin@betty.local"
                  className="h-9 text-xs"
                  disabled={isLoading}
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-xs text-destructive">
                    {errors.email.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs">
                    {t("passwordLabel")}
                  </Label>
                  <Link
                    href="/forgot-password"
                    className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {t("forgotPasswordLink")}
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="h-9 text-xs"
                  disabled={isLoading}
                  {...register("password")}
                />
                {errors.password && (
                  <p className="text-xs text-destructive">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                variant="secondary"
                className="w-full h-9 text-xs font-semibold"
                disabled={isLoading}
              >
                {isLoading && (
                  <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                )}
                {t("loginButton")}
              </Button>
            </form>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex justify-center border-t py-3 text-xs text-muted-foreground bg-muted/20">
        <span>Gestión de identidad federada por </span>
        <strong className="text-foreground ml-1">
          Keycloak OpenID Connect
        </strong>
      </CardFooter>
    </Card>
  );
}
