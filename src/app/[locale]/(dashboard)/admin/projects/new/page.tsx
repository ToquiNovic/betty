'use client';

import React from 'react';
import { ProjectForm } from '@/components/admin/projects/project-form';
import { PageHeader } from '@/components/common/page-header';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/routing';
import { ArrowLeft } from 'lucide-react';

export default function NewProjectPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Button
          render={<Link href="/admin/projects" />}
          variant="ghost"
          size="icon-sm"
          className="h-8 w-8 text-muted-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <PageHeader
          title="Crear Nuevo Proyecto"
          subtitle="Define la información general del proyecto. Tras crearlo, podrás agregar los pasos, materiales, firmware y modelo 3D."
        />
      </div>

      <ProjectForm />
    </div>
  );
}
