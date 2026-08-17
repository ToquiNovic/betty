'use client';

import React, { useState, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { DocHeading } from '@/lib/docs-manifest';
import { cn } from '@/lib/utils';
import { AlignLeft } from 'lucide-react';

interface DocsTableOfContentsProps {
  headings: DocHeading[];
}

export function DocsTableOfContents({ headings }: DocsTableOfContentsProps) {
  const locale = useLocale();
  const [activeId, setActiveId] = useState<string>('');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '0% 0% -80% 0%' }
    );

    headings.forEach((heading) => {
      const el = document.getElementById(heading.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 py-6 px-4 text-xs">
      <div className="flex items-center gap-2 font-semibold uppercase tracking-wider text-muted-foreground">
        <AlignLeft className="h-3.5 w-3.5 text-primary" />
        <span>{locale === 'en' ? 'On this page' : 'En esta página'}</span>
      </div>

      <nav className="flex flex-col gap-1 border-l border-border/50 pl-3">
        {headings.map((heading) => (
          <a
            key={heading.id}
            href={`#${heading.id}`}
            className={cn(
              'py-1 transition-colors hover:text-foreground line-clamp-1',
              heading.level === 3 && 'pl-2 text-[11px]',
              activeId === heading.id
                ? 'text-primary font-semibold border-l-2 border-primary -ml-[13px] pl-[11px]'
                : 'text-muted-foreground'
            )}
          >
            {heading.text}
          </a>
        ))}
      </nav>
    </div>
  );
}
