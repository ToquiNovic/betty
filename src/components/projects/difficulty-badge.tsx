import React from 'react';
import { ProjectDifficulty } from '@/types/project';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Sparkles, Gauge, Zap } from 'lucide-react';

interface DifficultyBadgeProps {
  difficulty: ProjectDifficulty;
  className?: string;
}

export function DifficultyBadge({ difficulty, className }: DifficultyBadgeProps) {
  const configs: Record<
    ProjectDifficulty,
    { label: string; icon: React.ComponentType<{ className?: string }>; style: string }
  > = {
    beginner: {
      label: 'Principiante',
      icon: Sparkles,
      style: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    },
    intermediate: {
      label: 'Intermedio',
      icon: Gauge,
      style: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    },
    advanced: {
      label: 'Avanzado',
      icon: Zap,
      style: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    },
  };

  const config = configs[difficulty] || configs.beginner;
  const Icon = config.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        'font-medium text-xs gap-1 px-2 py-0.5 capitalize border transition-colors',
        config.style,
        className,
      )}
    >
      <Icon className="h-3 w-3" />
      <span>{config.label}</span>
    </Badge>
  );
}
