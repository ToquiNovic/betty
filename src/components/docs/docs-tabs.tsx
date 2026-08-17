'use client';

import React, { useState } from 'react';
import { DocsCodeBlock } from './docs-code-block';
import { cn } from '@/lib/utils';

export interface CodeTab {
  label: string;
  language: string;
  code: string;
}

interface DocsTabsProps {
  tabs: CodeTab[];
}

export function DocsTabs({ tabs }: DocsTabsProps) {
  const [activeTab, setActiveTab] = useState(0);

  if (!tabs || tabs.length === 0) return null;

  return (
    <div className="my-6 rounded-xl border border-border/80 bg-card overflow-hidden shadow-xl">
      {/* Tabs Header */}
      <div className="flex items-center gap-1 px-3 pt-2 bg-muted/40 border-b border-border/60 overflow-x-auto">
        {tabs.map((tab, idx) => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(idx)}
            className={cn(
              'px-3.5 py-2 text-xs font-semibold rounded-t-lg transition-all border-b-2 whitespace-nowrap',
              activeTab === idx
                ? 'bg-background text-primary border-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground border-transparent hover:bg-muted/60'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-0">
        <DocsCodeBlock language={tabs[activeTab].language}>
          {tabs[activeTab].code}
        </DocsCodeBlock>
      </div>
    </div>
  );
}
