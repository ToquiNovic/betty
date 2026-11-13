"use client";

import React from "react";
import { useTranslations } from "next-intl";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Ua3dAuthButton } from "./ua3d-auth-button";

export function LoginForm() {
  const t = useTranslations("auth");

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
        {/* Exclusive Unified Authentication Action */}
        <div className="space-y-3 p-1 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
          <Ua3dAuthButton />
        </div>

        <div className="rounded-lg bg-muted/40 p-3 text-[11px] text-muted-foreground space-y-1.5 border border-border/50">
          <p className="font-semibold text-foreground flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Acceso Unificado con Cuentas de la Grid (Keycloak SSO):
          </p>
          <p>
            • <strong>Administrador:</strong> usuario <code>admin</code> |
            contraseña <code>admin</code>
          </p>
          <p>
            • <strong>Operador / Avatar:</strong> usuario <code>operator</code>{" "}
            o tu avatar institucional de OpenSim
          </p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium pt-0.5">
            💡 Haz clic en el botón superior para autenticarte mediante el proveedor de identidad de la Grid.
          </p>
        </div>
      </CardContent>

      <CardFooter className="flex justify-center border-t py-3 text-xs text-muted-foreground bg-muted/20">
        <span>Gestión de identidad institucional por </span>
        <strong className="text-foreground ml-1">
          Keycloak OpenID Connect
        </strong>
      </CardFooter>
    </Card>
  );
}
