import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { DOCS_MANIFEST } from "@/lib/docs-manifest";
import { getDocContent } from "@/lib/docs-server";
import { DocsMarkdownRenderer } from "@/components/docs/docs-markdown-renderer";
import { DocsTableOfContents } from "@/components/docs/docs-toc";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ArrowLeft, ArrowRight, BookOpen } from "lucide-react";

interface DocPageProps {
  params: Promise<{
    slug: string[];
  }>;
}

export async function generateMetadata({ params }: DocPageProps) {
  const { slug } = await params;
  const locale = await getLocale();
  const doc = getDocContent(slug, locale);

  if (!doc) {
    return {
      title: "Documentación | Betty PaaS",
    };
  }

  return {
    title: `${doc.title} | Betty Docs`,
    description: doc.description,
  };
}

export default async function DocDetailPage({ params }: DocPageProps) {
  const { slug } = await params;
  const locale = await getLocale();
  const doc = getDocContent(slug, locale);

  if (!doc) {
    notFound();
  }

  const isEn = locale === "en";
  const categoryId = slug[0];
  const category = DOCS_MANIFEST.find((c) => c.id === categoryId);
  const categoryTitle = category
    ? isEn
      ? category.titleEn
      : category.title
    : categoryId;

  return (
    <div className="w-full flex gap-8 items-start">
      {/* Article Content Column */}
      <article className="flex-1 min-w-0 max-w-3xl">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-6 font-medium">
          <Link
            href={`/${locale}/docs`}
            className="hover:text-foreground transition-colors"
          >
            Docs
          </Link>
          <ChevronRight className="h-3.5 w-3.5 opacity-60" />
          <span className="text-muted-foreground">{categoryTitle}</span>
          <ChevronRight className="h-3.5 w-3.5 opacity-60" />
          <span className="text-foreground font-semibold truncate">
            {doc.title}
          </span>
        </nav>

        {/* Page Header */}
        <div className="flex flex-col gap-3 pb-6 border-b border-border/60">
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className="text-[11px] bg-primary/10 text-primary border-primary/20"
            >
              <BookOpen className="h-3 w-3 mr-1" />
              <span>{categoryTitle}</span>
            </Badge>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            {doc.title}
          </h1>
          {doc.description && (
            <p className="text-base text-muted-foreground leading-relaxed">
              {doc.description}
            </p>
          )}
        </div>

        {/* Markdown Body */}
        <div className="mt-8">
          <DocsMarkdownRenderer content={doc.content} />
        </div>

        {/* Bottom Pagination Links (Prev / Next) */}
        <div className="mt-14 pt-6 border-t border-border/60 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {doc.prev ? (
            <Link href={`/${locale}/docs/${doc.prev.slug}`} className="group">
              <div className="flex flex-col gap-1 p-4 rounded-xl border border-border/70 bg-card/50 hover:bg-card hover:border-primary/40 transition-all text-left">
                <span className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <ArrowLeft className="h-3 w-3 group-hover:-translate-x-0.5 transition-transform" />
                  <span>{isEn ? "Previous" : "Anterior"}</span>
                </span>
                <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                  {doc.prev.title}
                </span>
              </div>
            </Link>
          ) : (
            <div />
          )}

          {doc.next ? (
            <Link href={`/${locale}/docs/${doc.next.slug}`} className="group">
              <div className="flex flex-col gap-1 p-4 rounded-xl border border-border/70 bg-card/50 hover:bg-card hover:border-primary/40 transition-all text-right items-end">
                <span className="flex items-center gap-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                  <span>{isEn ? "Next" : "Siguiente"}</span>
                  <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                </span>
                <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                  {doc.next.title}
                </span>
              </div>
            </Link>
          ) : (
            <div />
          )}
        </div>
      </article>

      {/* Right Column: Table of Contents (Desktop XL) */}
      <aside className="hidden xl:block w-64 shrink-0 sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
        <DocsTableOfContents headings={doc.headings} />
      </aside>
    </div>
  );
}
