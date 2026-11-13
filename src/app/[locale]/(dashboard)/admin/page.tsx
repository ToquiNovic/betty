"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { useUsers } from "@/lib/api/users";
import { useAdminTeams } from "@/lib/api/teams";
import { useAdminSensors } from "@/lib/api/sensors";
import { PageHeader } from "@/components/common/page-header";
import { UsersTable } from "@/components/admin/users-table";
import { AdminTeamsTable } from "@/components/admin/admin-teams-table";
import { AdminSensorsTable } from "@/components/admin/admin-sensors-table";
import { TableSkeleton } from "@/components/common/loading-skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Users, Cpu, Search, UsersRound, Radio } from "lucide-react";

export default function AdminPage() {
  const t = useTranslations("admin");
  const [activeTab, setActiveTab] = useState<"users" | "teams" | "sensors">(
    "users",
  );
  const [search, setSearch] = useState("");

  const {
    users,
    isLoading: isUsersLoading,
    mutate: mutateUsers,
  } = useUsers(100);
  const { teams, isLoading: isTeamsLoading } = useAdminTeams(
    activeTab === "teams" ? search : undefined,
  );
  const { sensors, isLoading: isSensorsLoading } = useAdminSensors(
    activeTab === "sensors" ? search : undefined,
  );

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()),
  );

  const adminCount = users.filter((u) => u.role === "admin").length;
  const activeSensorsCount = sensors.filter(
    (s) => s.status === "active",
  ).length;
  const loraSensorsCount = sensors.filter(
    (s) =>
      s.metadata?.hardware === "LoRaWAN" ||
      (s.metadata as any)?.lora_config !== undefined,
  ).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        subtitle="Gestión global de usuarios, grupos de investigación y sensores de Botuto Platform"
      />

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Users Card */}
        <Card className="border shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                {t("totalUsers")}
              </p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-extrabold font-mono text-foreground">
                  {users.length}
                </p>
                <span className="text-[11px] font-medium text-amber-500 font-mono">
                  ({adminCount} admin)
                </span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Groups / Teams Card */}
        <Card className="border shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Grupos / Equipos
              </p>
              <p className="text-3xl font-extrabold font-mono text-foreground">
                {teams.length}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-sky-500/10 text-sky-500">
              <UsersRound className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* Total Sensors Card */}
        <Card className="border shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Sensores Creados
              </p>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-extrabold font-mono text-foreground">
                  {sensors.length}
                </p>
                <span className="text-[11px] font-medium text-emerald-500 font-mono">
                  ({activeSensorsCount} activos)
                </span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-emerald-500/10 text-emerald-500">
              <Cpu className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* LoRa Nodes Card */}
        <Card className="border shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">
                Nodos de Red LoRa
              </p>
              <p className="text-3xl font-extrabold font-mono text-cyan-600 dark:text-cyan-400">
                {loraSensorsCount}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-cyan-500/10 text-cyan-500">
              <Radio className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admin Tabs Section */}
      <Tabs
        value={activeTab}
        onValueChange={(val) => {
          setActiveTab(val as "users" | "teams" | "sensors");
          setSearch("");
        }}
        className="space-y-4"
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <TabsList className="grid grid-cols-3 w-full sm:w-105">
            <TabsTrigger
              value="users"
              className="gap-1.5 text-xs font-semibold"
            >
              <Users className="h-3.5 w-3.5" />
              <span>Usuarios ({users.length})</span>
            </TabsTrigger>
            <TabsTrigger
              value="teams"
              className="gap-1.5 text-xs font-semibold"
            >
              <UsersRound className="h-3.5 w-3.5 text-sky-500" />
              <span>Grupos ({teams.length})</span>
            </TabsTrigger>
            <TabsTrigger
              value="sensors"
              className="gap-1.5 text-xs font-semibold"
            >
              <Cpu className="h-3.5 w-3.5 text-primary" />
              <span>Sensores ({sensors.length})</span>
            </TabsTrigger>
          </TabsList>

          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={
                activeTab === "users"
                  ? "Buscar por nombre o correo..."
                  : activeTab === "teams"
                    ? "Buscar por nombre de equipo, dueño o código..."
                    : "Buscar sensor por nombre..."
              }
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>

        {/* Tab 1: Users */}
        <TabsContent value="users" className="space-y-4">
          {isUsersLoading ? (
            <TableSkeleton rows={6} />
          ) : (
            <UsersTable
              users={filteredUsers}
              onUserUpdated={() => mutateUsers()}
            />
          )}
        </TabsContent>

        {/* Tab 2: Teams / Groups */}
        <TabsContent value="teams" className="space-y-4">
          {isTeamsLoading ? (
            <TableSkeleton rows={6} />
          ) : (
            <AdminTeamsTable teams={teams} />
          )}
        </TabsContent>

        {/* Tab 3: Sensors */}
        <TabsContent value="sensors" className="space-y-4">
          {isSensorsLoading ? (
            <TableSkeleton rows={6} />
          ) : (
            <AdminSensorsTable sensors={sensors} />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
