'use client';

import React from 'react';
import { ProjectStep } from '@/types/project';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Layers, Video } from 'lucide-react';

interface ProjectStepsProps {
  steps: ProjectStep[];
}

export function ProjectStepsList({ steps }: ProjectStepsProps) {
  if (!steps || steps.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center border rounded-lg bg-muted/20 text-muted-foreground">
        <Layers className="h-10 w-10 mb-2 opacity-40" />
        <p className="text-sm font-medium">Este proyecto aún no tiene pasos definidos.</p>
      </div>
    );
  }

  const sortedSteps = [...steps].sort((a, b) => a.stepOrder - b.stepOrder);

  return (
    <div className="space-y-6">
      {sortedSteps.map((step, idx) => (
        <Card key={step.id} className="border shadow-sm overflow-hidden bg-card">
          <CardHeader className="p-4 sm:p-5 pb-3 border-b bg-muted/20 flex flex-row items-center gap-3">
            <div className="flex items-center justify-center h-7 w-7 rounded-full bg-primary text-primary-foreground font-bold text-xs shrink-0">
              {idx + 1}
            </div>
            <CardTitle className="text-base font-bold tracking-tight">
              {step.title}
            </CardTitle>
          </CardHeader>

          <CardContent className="p-4 sm:p-5 space-y-4">
            {/* Step Image */}
            {step.imageUrl && (
              <div className="relative rounded-lg overflow-hidden border max-h-[400px] w-full bg-muted/40 flex items-center justify-center">
                <img
                  src={step.imageUrl}
                  alt={step.title}
                  className="w-full max-h-[400px] object-contain"
                />
              </div>
            )}

            {/* Step Content (Formatted Markdown / Text) */}
            <div className="prose prose-sm dark:prose-invert max-w-none text-sm text-foreground/90 whitespace-pre-line leading-relaxed">
              {step.content}
            </div>

            {/* Video Link / Embed if available */}
            {step.videoUrl && (
              <div className="flex items-center gap-2 text-xs text-primary pt-2">
                <Video className="h-4 w-4" />
                <a
                  href={step.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-primary/80 font-medium"
                >
                  Ver video explicativo del paso
                </a>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
