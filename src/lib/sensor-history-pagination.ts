export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

export const DEFAULT_PAGE_SIZE = 25;

export interface PaginatedResult<T> {
  items: T[];
  currentPage: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
}

export type PaginationToken = number | 'ellipsis';

/** Clamp a 1-based page number to the valid range for the given item count and page size. */
export function clampPage(page: number, totalItems: number, pageSize: number): number {
  const safeSize = Math.max(1, Math.floor(pageSize));
  const totalPages = Math.max(1, Math.ceil(totalItems / safeSize));
  const safePage = Number.isFinite(page) ? Math.floor(page) : 1;
  return Math.min(Math.max(1, safePage), totalPages);
}

/** Return the sliced items and 1-based range metadata for the requested page. */
export function paginateItems<T>(
  items: readonly T[],
  page: number,
  pageSize: number
): PaginatedResult<T> {
  const totalItems = items.length;
  const safeSize = Math.max(1, Math.floor(pageSize));
  const totalPages = Math.max(1, Math.ceil(totalItems / safeSize));
  const currentPage = clampPage(page, totalItems, safeSize);

  if (totalItems === 0) {
    return {
      items: [],
      currentPage: 1,
      totalPages: 1,
      totalItems: 0,
      startIndex: 0,
      endIndex: 0,
    };
  }

  const offset = (currentPage - 1) * safeSize;
  const sliced = items.slice(offset, offset + safeSize);

  return {
    items: sliced,
    currentPage,
    totalPages,
    totalItems,
    startIndex: offset + 1,
    endIndex: offset + sliced.length,
  };
}

/** Build a compact sequence of page numbers and ellipsis markers around the active page. */
export function buildPaginationRange(
  currentPage: number,
  totalPages: number
): PaginationToken[] {
  const safeTotal = Math.max(1, Math.floor(totalPages));
  const safeCurrent = clampPage(currentPage, safeTotal, 1);

  if (safeTotal <= 7) {
    return Array.from({ length: safeTotal }, (_, index) => index + 1);
  }

  if (safeCurrent <= 3) {
    return [1, 2, 3, 4, 'ellipsis', safeTotal];
  }

  if (safeCurrent >= safeTotal - 2) {
    return [1, 'ellipsis', safeTotal - 3, safeTotal - 2, safeTotal - 1, safeTotal];
  }

  return [
    1,
    'ellipsis',
    safeCurrent - 1,
    safeCurrent,
    safeCurrent + 1,
    'ellipsis',
    safeTotal,
  ];
}

/** Serialize a telemetry payload into formatted multi-line JSON without throwing. */
export function formatPayloadJson(payload: unknown): string {
  if (payload === undefined) {
    return '{}';
  }
  try {
    return JSON.stringify(payload, null, 2);
  } catch {
    return String(payload);
  }
}

/** Serialize a telemetry payload into a single-line compact JSON string. */
export function formatPayloadCompact(payload: unknown): string {
  if (payload === undefined) {
    return '{}';
  }
  try {
    return JSON.stringify(payload);
  } catch {
    return String(payload);
  }
}

/** Count top-level keys when the payload is a plain JSON object. */
export function getPayloadKeyCount(payload: unknown): number {
  if (payload !== null && typeof payload === 'object' && !Array.isArray(payload)) {
    return Object.keys(payload).length;
  }
  return 0;
}
