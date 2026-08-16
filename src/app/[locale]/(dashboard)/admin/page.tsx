'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useUsers } from '@/lib/api/users';
import { PageHeader } from '@/components/common/page-header';
import { UsersTable } from '@/components/admin/users-table';
import { TableSkeleton } from '@/components/common/loading-skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Users, Shield, User, Search } from 'lucide-react';

export default function AdminPage() {
  const t = useTranslations('admin');
  const { users, isLoading, mutate } = useUsers(100);
  const [search, setSearch] = useState('');

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const adminCount = users.filter((u) => u.role === 'admin').length;
  const standardCount = users.filter((u) => u.role === 'user').length;

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">{t('totalUsers')}</p>
              <p className="text-3xl font-extrabold font-mono text-foreground">{users.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">{t('adminUsers')}</p>
              <p className="text-3xl font-extrabold font-mono text-amber-600 dark:text-amber-400">
                {adminCount}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-amber-500/10 text-amber-500">
              <Shield className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">{t('standardUsers')}</p>
              <p className="text-3xl font-extrabold font-mono text-foreground">{standardCount}</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10 text-blue-500">
              <User className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Directory */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre o correo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-xs"
            />
          </div>
        </div>

        {isLoading ? (
          <TableSkeleton rows={6} />
        ) : (
          <UsersTable users={filteredUsers} onUserUpdated={() => mutate()} />
        )}
      </div>
    </div>
  );
}
