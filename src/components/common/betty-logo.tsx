import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export interface BettyLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  showBadge?: boolean;
  subtitle?: string | boolean;
  variant?: 'emblem-text' | 'full-image' | 'icon-only';
  className?: string;
  priority?: boolean;
  collapseOnSidebar?: boolean;
}

const sizeConfig = {
  xs: {
    icon: 20,
    text: 'text-sm',
    badge: 'text-[9px] px-1 py-0',
    sub: 'text-[9px]',
    gap: 'gap-1.5',
    imageWidth: 90,
    imageHeight: 32,
  },
  sm: {
    icon: 28,
    text: 'text-base',
    badge: 'text-[10px] px-1.5 py-0.2',
    sub: 'text-[10px]',
    gap: 'gap-2',
    imageWidth: 120,
    imageHeight: 42,
  },
  md: {
    icon: 36,
    text: 'text-lg',
    badge: 'text-[10px] px-1.5 py-0.5',
    sub: 'text-[10px]',
    gap: 'gap-2.5',
    imageWidth: 150,
    imageHeight: 53,
  },
  lg: {
    icon: 44,
    text: 'text-xl',
    badge: 'text-xs px-2 py-0.5',
    sub: 'text-xs',
    gap: 'gap-3',
    imageWidth: 180,
    imageHeight: 64,
  },
  xl: {
    icon: 56,
    text: 'text-2xl',
    badge: 'text-xs px-2 py-0.5',
    sub: 'text-sm',
    gap: 'gap-3.5',
    imageWidth: 220,
    imageHeight: 78,
  },
};

export function BettyLogo({
  size = 'md',
  showText = true,
  showBadge = false,
  subtitle = false,
  variant = 'emblem-text',
  className,
  priority = false,
  collapseOnSidebar = false,
}: BettyLogoProps) {
  const config = sizeConfig[size];

  if (variant === 'full-image') {
    return (
      <div className={cn('relative inline-flex items-center shrink-0', className)}>
        <Image
          src="/logo.png"
          alt="Betty Platform"
          width={config.imageWidth}
          height={config.imageHeight}
          priority={priority}
          className="object-contain h-auto"
        />
      </div>
    );
  }

  if (variant === 'icon-only' || !showText) {
    return (
      <div
        className={cn(
          'relative inline-flex items-center justify-center shrink-0 rounded-xl transition-transform',
          className,
        )}
        style={{ width: config.icon, height: config.icon }}
      >
        <Image
          src="/logo-icon.png"
          alt="Betty Platform"
          width={config.icon}
          height={config.icon}
          priority={priority}
          className="object-contain w-full h-full drop-shadow-sm"
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'inline-flex items-center',
        config.gap,
        collapseOnSidebar && 'group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:w-full',
        className,
      )}
    >
      <div
        className="relative shrink-0 flex items-center justify-center transition-transform group-hover:scale-105"
        style={{ width: config.icon, height: config.icon }}
      >
        <Image
          src="/logo-icon.png"
          alt="Betty Platform Emblem"
          width={config.icon}
          height={config.icon}
          priority={priority}
          className="object-contain w-full h-full drop-shadow-sm"
        />
      </div>

      <div
        className={cn(
          'flex flex-col leading-tight select-none',
          collapseOnSidebar && 'group-data-[collapsible=icon]:hidden',
        )}
      >
        <div className="flex items-center gap-1.5">
          <span
            className={cn(
              'font-extrabold tracking-tight text-foreground transition-colors',
              config.text,
            )}
          >
            Betty
          </span>
          <span
            className={cn(
              'font-bold tracking-tight text-[#8610E6] dark:text-[#a855f7] transition-colors',
              config.text,
            )}
          >
            Platform
          </span>

          {showBadge && (
            <span
              className={cn(
                'font-mono font-semibold rounded-full bg-primary/10 text-primary border border-primary/20 leading-none',
                config.badge,
              )}
            >
              AEP
            </span>
          )}
        </div>

        {subtitle && (
          <span className={cn('text-muted-foreground font-mono leading-none mt-0.5', config.sub)}>
            {typeof subtitle === 'string' ? subtitle : 'IoT & Digital Twins'}
          </span>
        )}
      </div>
    </div>
  );
}
