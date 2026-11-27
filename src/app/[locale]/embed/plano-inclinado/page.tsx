import React, { Suspense } from 'react';
import { PlanoInclinadoEmbedView } from '@/components/projects/plano-inclinado/plano-inclinado-embed-view';

export const dynamic = 'force-dynamic';

export default function PlanoInclinadoEmbedPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen w-full bg-[#070b12] text-slate-300 flex items-center justify-center font-mono text-sm">
          Cargando pantalla matemática en tiempo real...
        </div>
      }
    >
      <PlanoInclinadoEmbedView />
    </Suspense>
  );
}
