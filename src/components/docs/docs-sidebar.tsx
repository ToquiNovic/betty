'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { DOCS_MANIFEST, DocCategory } from '@/lib/docs-manifest';
import { cn } from '@/lib/utils';
import {
  Rocket,
  Radio,
  Cpu,
  Box,
  Wrench,
  ShieldCheck,
  Code,
  FileText,
  ChevronRight,
} from 'lucide-react';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Rocket,
  Radio,
  Cpu,
  Box,
  Wrench,
  ShieldCheck,
  Code,
};

interface DocsSidebarProps {
  className?: string;
  onItemClick?: () => void;
}

export function DocsSidebar({ className, onItemClick }: DocsSidebarProps) {
  const pathname = usePathname();
  const locale = useLocale();

  return (
    <nav className={cn('flex flex-col gap-6 py-6 px-4 text-sm', className)}>
      {DOCS_MANIFEST.map((category) => {
        const IconComponent = ICON_MAP[category.icon] || FileText;
        const categoryTitle = locale === 'en' ? category.titleEn : category.title;

        return (
          <div key={category.id} className="flex flex-col gap-1.5">
            <div className="flex items-center gap-2 px-2.5 py-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground/80">
              <IconComponent className="h-3.5 w-3.5 text-primary/70 shrink-0" />
              <span>{categoryTitle}</span>
            </div>

            <div className="flex flex-col gap-0.5 mt-0.5 border-l border-border/50 ml-3.5 pl-2">
              {category.items.map((item) => {
                const itemHref = `/${locale}/docs/${item.slug}`;
                const isActive = pathname === itemHref;
                const itemTitle = locale === 'en' ? item.titleEn : item.title;

                return (
                  <Link
                    key={item.slug}
                    href={itemHref}
                    onClick={onItemClick}
                    className={cn(
                      'flex items-center justify-between px-3 py-1.5 rounded-md text-xs font-medium transition-all',
                      isActive
                        ? 'bg-primary/10 text-primary font-semibold border-l-2 border-primary -ml-[9px] pl-[15px]'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                  >
                    <span className="truncate">{itemTitle}</span>
                    {isActive && <ChevronRight className="h-3 w-3 text-primary shrink-0 opacity-80" />}
                  </Link>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
}
