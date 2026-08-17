'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { DOCS_MANIFEST } from '@/lib/docs-manifest';
import { Search, FileText, ArrowRight } from 'lucide-react';

interface DocsSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DocsSearchDialog({ open, onOpenChange }: DocsSearchDialogProps) {
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [open, onOpenChange]);

  const handleSelect = (slug: string) => {
    onOpenChange(false);
    router.push(`/${locale}/docs/${slug}`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0 overflow-hidden max-w-xl bg-background/95 backdrop-blur-xl border-border/80 shadow-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Buscar en la Documentación</DialogTitle>
        </DialogHeader>
        <Command className="border-0">
          <CommandInput placeholder={locale === 'en' ? 'Search docs, guides, SDKs...' : 'Buscar guías, MQTT, ESP32, REST...'} />
          <CommandList className="max-h-[380px] p-2">
            <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">
              {locale === 'en' ? 'No documentation found.' : 'No se encontraron resultados.'}
            </CommandEmpty>
            {DOCS_MANIFEST.map((category) => (
              <CommandGroup key={category.id} heading={locale === 'en' ? category.titleEn : category.title}>
                {category.items.map((item) => (
                  <CommandItem
                    key={item.slug}
                    value={`${item.title} ${item.titleEn} ${item.description}`}
                    onSelect={() => handleSelect(item.slug)}
                    className="flex items-center justify-between py-2.5 px-3 rounded-lg cursor-pointer hover:bg-primary/10 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileText className="h-4 w-4 text-primary shrink-0" />
                      <div className="flex flex-col">
                        <span className="font-medium text-sm text-foreground">
                          {locale === 'en' ? item.titleEn : item.title}
                        </span>
                        <span className="text-xs text-muted-foreground line-clamp-1">
                          {locale === 'en' ? item.descriptionEn : item.description}
                        </span>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground opacity-60" />
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
