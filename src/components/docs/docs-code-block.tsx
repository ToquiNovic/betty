'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check, Terminal } from 'lucide-react';

interface DocsCodeBlockProps {
  language?: string;
  children: string;
}

export function DocsCodeBlock({ language = 'bash', children }: DocsCodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children.trim());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy', e);
    }
  };

  return (
    <div className="relative group my-5 rounded-xl border border-border/80 bg-slate-950 dark:bg-slate-950/90 shadow-xl overflow-hidden text-slate-50">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/90 border-b border-border/40 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 opacity-60">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
          </div>
          <span className="ml-2 font-mono text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">
            {language}
          </span>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleCopy}
          className="h-7 px-2.5 text-xs text-slate-300 hover:text-white hover:bg-slate-800/80 gap-1.5 rounded-md transition-all"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400 text-[11px]">Copiado</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 opacity-70" />
              <span className="text-[11px]">Copiar</span>
            </>
          )}
        </Button>
      </div>

      {/* Code Content */}
      <div className="p-4 overflow-x-auto font-mono text-xs leading-relaxed selection:bg-primary/30">
        <pre className="m-0 p-0 font-mono text-slate-200">
          <code>{children.trim()}</code>
        </pre>
      </div>
    </div>
  );
}
