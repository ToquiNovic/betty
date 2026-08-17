import fs from 'fs';
import path from 'path';
import { DOCS_MANIFEST, DocContent, DocHeading } from './docs-manifest';

/**
 * Reads and parses a markdown document on the server.
 */
export function getDocContent(slugArray: string[], locale: string = 'es'): DocContent | null {
  const slug = slugArray.join('/');
  
  // Try locale-specific path
  let filePath = path.join(process.cwd(), 'src', 'content', locale === 'en' ? 'en' : '', `${slug}.md`);
  if (!fs.existsSync(filePath)) {
    filePath = path.join(process.cwd(), 'src', 'content', `${slug}.md`);
  }
  if (!fs.existsSync(filePath)) {
    return null;
  }

  const raw = fs.readFileSync(filePath, 'utf-8');

  // Parse Frontmatter
  let title = '';
  let description = '';
  let body = raw;

  const fmMatch = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (fmMatch) {
    const fm = fmMatch[1];
    body = fmMatch[2];
    const titleMatch = fm.match(/title:\s*(.*)/);
    const descMatch = fm.match(/description:\s*(.*)/);
    if (titleMatch) title = titleMatch[1].trim().replace(/^['"](.*)['"]$/, '$1');
    if (descMatch) description = descMatch[1].trim().replace(/^['"](.*)['"]$/, '$1');
  }

  // Extract headings for Table of Contents
  const headings: DocHeading[] = [];
  const lines = body.split('\n');
  lines.forEach((line) => {
    const h2Match = line.match(/^##\s+(.*)/);
    const h3Match = line.match(/^###\s+(.*)/);
    if (h2Match) {
      const text = h2Match[1].replace(/[`*]/g, '').trim();
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      headings.push({ id, text, level: 2 });
    } else if (h3Match) {
      const text = h3Match[1].replace(/[`*]/g, '').trim();
      const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      headings.push({ id, text, level: 3 });
    }
  });

  // Calculate prev and next
  const flatItems: { slug: string; title: string }[] = [];
  DOCS_MANIFEST.forEach((cat) => {
    cat.items.forEach((item) => {
      flatItems.push({
        slug: item.slug,
        title: locale === 'en' ? item.titleEn : item.title,
      });
    });
  });

  const currentIndex = flatItems.findIndex((item) => item.slug === slug);
  const prev = currentIndex > 0 ? flatItems[currentIndex - 1] : undefined;
  const next = currentIndex < flatItems.length - 1 && currentIndex >= 0 ? flatItems[currentIndex + 1] : undefined;

  return {
    slug,
    title: title || slug,
    description,
    content: body,
    headings,
    prev,
    next,
  };
}
