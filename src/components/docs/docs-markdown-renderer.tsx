'use client';

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import Link from 'next/link';
import { DocsCodeBlock } from './docs-code-block';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, AlertTriangle, CheckCircle2, AlertOctagon } from 'lucide-react';

interface DocsMarkdownRendererProps {
  content: string;
}

export function DocsMarkdownRenderer({ content }: DocsMarkdownRendererProps) {
  return (
    <div className="docs-prose max-w-none text-foreground text-sm leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mt-8 mb-4 border-b border-border/60 pb-3">
              {children}
            </h1>
          ),
          h2: ({ children }) => {
            const text = String(children).replace(/[`*]/g, '').trim();
            const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            return (
              <h2 id={id} className="group scroll-m-20 text-xl font-bold tracking-tight text-foreground mt-10 mb-3 border-b border-border/40 pb-2">
                <a href={`#${id}`} className="hover:text-primary transition-colors inline-flex items-center gap-2">
                  {children}
                </a>
              </h2>
            );
          },
          h3: ({ children }) => {
            const text = String(children).replace(/[`*]/g, '').trim();
            const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
            return (
              <h3 id={id} className="scroll-m-20 text-base font-semibold tracking-tight text-foreground mt-6 mb-2">
                <a href={`#${id}`} className="hover:text-primary transition-colors">
                  {children}
                </a>
              </h3>
            );
          },
          p: ({ children }) => (
            <p className="leading-7 [&:not(:first-child)]:mt-3 mb-3 text-muted-foreground">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="my-4 ml-6 list-disc [&>li]:mt-1.5 text-muted-foreground">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-4 ml-6 list-decimal [&>li]:mt-1.5 text-muted-foreground">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">{children}</li>
          ),
          blockquote: ({ children }) => {
            const text = String(children);
            const isWarning = text.includes('⚠️') || text.toLowerCase().includes('warning') || text.toLowerCase().includes('advertencia');
            const isDanger = text.includes('🛑') || text.toLowerCase().includes('danger') || text.toLowerCase().includes('peligro');
            const isSuccess = text.includes('✅') || text.toLowerCase().includes('tip');

            if (isWarning) {
              return (
                <Alert variant="destructive" className="my-4 bg-amber-500/10 border-amber-500/30 text-amber-300">
                  <AlertTriangle className="h-4 w-4 !text-amber-400" />
                  <AlertDescription className="text-xs text-amber-200">
                    {children}
                  </AlertDescription>
                </Alert>
              );
            }
            if (isDanger) {
              return (
                <Alert variant="destructive" className="my-4 bg-rose-500/10 border-rose-500/30 text-rose-300">
                  <AlertOctagon className="h-4 w-4 !text-rose-400" />
                  <AlertDescription className="text-xs text-rose-200">
                    {children}
                  </AlertDescription>
                </Alert>
              );
            }
            if (isSuccess) {
              return (
                <Alert className="my-4 bg-emerald-500/10 border-emerald-500/30 text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 !text-emerald-400" />
                  <AlertDescription className="text-xs text-emerald-200">
                    {children}
                  </AlertDescription>
                </Alert>
              );
            }
            return (
              <Alert className="my-4 bg-primary/10 border-primary/30 text-primary-foreground">
                <Info className="h-4 w-4 !text-primary" />
                <AlertDescription className="text-xs text-muted-foreground">
                  {children}
                </AlertDescription>
              </Alert>
            );
          },
          hr: () => <hr className="my-6 border-border/60" />,
          table: ({ children }) => (
            <div className="my-6 w-full overflow-y-auto rounded-lg border border-border/80 shadow-sm">
              <table className="w-full text-left text-xs">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-muted/60 text-muted-foreground font-semibold border-b border-border/80">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-border/40 bg-card/40">{children}</tbody>
          ),
          tr: ({ children }) => (
            <tr className="hover:bg-muted/30 transition-colors">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="p-3 font-semibold text-foreground">{children}</th>
          ),
          td: ({ children }) => (
            <td className="p-3 text-muted-foreground">{children}</td>
          ),
          a: ({ href, children }) => {
            if (href?.startsWith('http')) {
              return (
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
                >
                  {children}
                </a>
              );
            }
            return (
              <Link
                href={href || '#'}
                className="font-medium text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
              >
                {children}
              </Link>
            );
          },
          code: ({ className, children }) => {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && !String(children).includes('\n');

            if (isInline) {
              return (
                <code className="relative rounded bg-muted/80 px-1.5 py-0.5 font-mono text-[12px] font-semibold text-primary border border-border/60">
                  {children}
                </code>
              );
            }

            return (
              <DocsCodeBlock language={match ? match[1] : 'bash'}>
                {String(children).replace(/\n$/, '')}
              </DocsCodeBlock>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
