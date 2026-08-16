'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useSensors } from '@/lib/api/sensors';
import { PageHeader } from '@/components/common/page-header';
import { SensorCard } from '@/components/sensors/sensor-card';
import { CreateSensorDialog } from '@/components/sensors/create-sensor-dialog';
import { CardGridSkeleton } from '@/components/common/loading-skeleton';
import { EmptyState } from '@/components/common/empty-state';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Radio, Search } from 'lucide-react';

export default function SensorsPage() {
  const t = useTranslations('sensors');
  const common = useTranslations('common');
  const { sensors, isLoading, mutate } = useSensors();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredSensors = sensors.filter((sensor) => {
    const matchesSearch =
      sensor.name.toLowerCase().includes(search.toLowerCase()) ||
      sensor.mqttTopic.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'all' ? true : sensor.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} subtitle={t('subtitle')}>
        <CreateSensorDialog onSuccess={() => mutate()} />
      </PageHeader>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={common('search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-muted-foreground font-medium">{common('filter')}:</span>
          <Select
            value={statusFilter}
            onValueChange={(val) => {
              if (val) setStatusFilter(val);
            }}
          >
            <SelectTrigger className="h-9 w-36 text-xs font-mono">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">
                {common('all')}
              </SelectItem>
              <SelectItem value="active" className="text-xs">
                {t('active')}
              </SelectItem>
              <SelectItem value="inactive" className="text-xs">
                {t('inactive')}
              </SelectItem>
              <SelectItem value="revoked" className="text-xs">
                {t('revoked')}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid of Sensors */}
      {isLoading ? (
        <CardGridSkeleton count={6} />
      ) : filteredSensors.length === 0 ? (
        <EmptyState
          icon={Radio}
          title="No se encontraron sensores"
          description="Comienza registrando tu primer sensor físico o dispositivo de metaverso."
        >
          <CreateSensorDialog onSuccess={() => mutate()} />
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSensors.map((sensor) => (
            <SensorCard key={sensor.id} sensor={sensor} />
          ))}
        </div>
      )}
    </div>
  );
}
