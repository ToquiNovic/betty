'use client';

import React, { useState } from 'react';
import { DocsHeader } from '@/components/docs/docs-header';
import { DocsSidebar } from '@/components/docs/docs-sidebar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col antialiased selection:bg-primary/20 selection:text-primary">
      {/* Top Navbar */}
      <DocsHeader onToggleMobileSidebar={() => setMobileMenuOpen(true)} />

      {/* Main Container */}
      <div className="flex-1 w-full max-w-7xl mx-auto flex">
        {/* Left Sticky Sidebar (Desktop) */}
        <aside className="hidden lg:block w-72 shrink-0 border-r border-border/60 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto">
          <DocsSidebar />
        </aside>

        {/* Mobile Sidebar Sheet */}
        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent side="left" className="w-80 p-0 overflow-y-auto bg-background/95 backdrop-blur-xl">
            <SheetHeader className="p-4 border-b border-border/60">
              <SheetTitle className="text-sm font-bold tracking-tight">
                Navegación de Documentación
              </SheetTitle>
            </SheetHeader>
            <DocsSidebar onItemClick={() => setMobileMenuOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 px-4 sm:px-8 py-8 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}
