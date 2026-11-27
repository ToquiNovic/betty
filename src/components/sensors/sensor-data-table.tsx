'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SensorData } from '@/types';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { OriginBadge } from './sensor-status-badge';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Clock,
  Copy,
  Database,
  PanelRightOpen,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';
import {
  buildPaginationRange,
  DEFAULT_PAGE_SIZE,
  formatPayloadCompact,
  formatPayloadJson,
  getPayloadKeyCount,
  PAGE_SIZE_OPTIONS,
  paginateItems,
} from '@/lib/sensor-history-pagination';

function formatTimestamp(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return format(date, 'yyyy-MM-dd HH:mm:ss');
}

export function SensorDataTable({ data }: { data: SensorData[] }) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const [expandedRowIds, setExpandedRowIds] = useState<Set<number>>(() => new Set());
  const [inspectedRow, setInspectedRow] = useState<SensorData | null>(null);
  const [copiedRowId, setCopiedRowId] = useState<number | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
    };
  }, []);

  const pagination = useMemo(
    () => paginateItems(data, page, pageSize),
    [data, page, pageSize]
  );

  const paginationTokens = useMemo(
    () => buildPaginationRange(pagination.currentPage, pagination.totalPages),
    [pagination.currentPage, pagination.totalPages]
  );

  const toggleRowExpanded = useCallback((rowId: number) => {
    setExpandedRowIds((prev) => {
      const next = new Set(prev);
      if (next.has(rowId)) {
        next.delete(rowId);
      } else {
        next.add(rowId);
      }
      return next;
    });
  }, []);

  const handleCopyPayload = useCallback(async (row: SensorData) => {
    try {
      await navigator.clipboard.writeText(formatPayloadJson(row.payload));
      setCopiedRowId(row.id);
      if (copyTimerRef.current) {
        clearTimeout(copyTimerRef.current);
      }
      copyTimerRef.current = setTimeout(() => {
        setCopiedRowId(null);
      }, 2000);
      toast.success('JSON copiado al portapapeles');
    } catch {
      toast.error('No se pudo copiar el JSON');
    }
  }, []);

  const handlePageChange = useCallback(
    (nextPage: number) => {
      if (nextPage < 1 || nextPage > pagination.totalPages) {
        return;
      }
      setPage(nextPage);
    },
    [pagination.totalPages]
  );

  const handlePageSizeChange = useCallback((value: string | null) => {
    if (!value) return;
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) return;
    setPageSize(parsed);
    setPage(1);
  }, []);

  const isFirstPage = pagination.currentPage <= 1;
  const isLastPage = pagination.currentPage >= pagination.totalPages;

  return (
    <>
      <Card className="border shadow-sm">
        <CardHeader className="p-5 pb-3">
          <div className="flex items-center gap-2">
            <Database className="size-4 text-primary" />
            <CardTitle className="text-base font-bold">
              Registro Histórico de Telemetría (TimescaleDB)
            </CardTitle>
          </div>
          <CardDescription className="text-xs">
            Hacé clic en una fila para desplegar el JSON completo o abrilo en el panel lateral.
          </CardDescription>
          <CardAction>
            <Badge variant="secondary" className="font-mono text-xs">
              {pagination.totalItems} registros
            </Badge>
          </CardAction>
        </CardHeader>

        <CardContent className="p-0">
          {data.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              No hay registros históricos para este sensor todavía.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-10" />
                  <TableHead className="w-24 font-mono text-xs">ID</TableHead>
                  <TableHead className="w-36 text-xs">Origen</TableHead>
                  <TableHead className="text-xs">Payload (JSON)</TableHead>
                  <TableHead className="w-44 text-right text-xs">Marca Temporal</TableHead>
                  <TableHead className="w-24 text-right text-xs">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagination.items.map((row) => {
                  const isExpanded = expandedRowIds.has(row.id);
                  const isCopied = copiedRowId === row.id;
                  const keyCount = getPayloadKeyCount(row.payload);
                  const compactPayload = formatPayloadCompact(row.payload);

                  return (
                    <React.Fragment key={row.id}>
                      <TableRow
                        className={cn(
                          'cursor-pointer text-xs font-mono',
                          isExpanded && 'bg-muted/40'
                        )}
                        onClick={() => {
                          const selection = window.getSelection()?.toString();
                          if (selection) return;
                          toggleRowExpanded(row.id);
                        }}
                      >
                        <TableCell className="pr-0">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            aria-expanded={isExpanded}
                            aria-label={
                              isExpanded
                                ? `Contraer mensaje ${row.id}`
                                : `Expandir mensaje ${row.id}`
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleRowExpanded(row.id);
                            }}
                          >
                            {isExpanded ? <ChevronDown /> : <ChevronRight />}
                          </Button>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{row.id}</TableCell>
                        <TableCell>
                          <OriginBadge origin={row.originType} />
                        </TableCell>
                        <TableCell className="max-w-52 sm:max-w-sm md:max-w-md lg:max-w-xl">
                          <div className="flex items-center gap-2 min-w-0">
                            <code className="block min-w-0 flex-1 truncate rounded bg-muted/60 px-2 py-0.5 text-xs text-foreground">
                              {compactPayload}
                            </code>
                            {keyCount > 0 && (
                              <Badge
                                variant="outline"
                                className="shrink-0 font-mono text-[10px] text-muted-foreground"
                              >
                                {keyCount} {keyCount === 1 ? 'clave' : 'claves'}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="size-3" />
                            {formatTimestamp(row.recordedAt)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div
                            className="inline-flex items-center justify-end gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              aria-label={`Copiar JSON del registro ${row.id}`}
                              title="Copiar JSON"
                              onClick={() => handleCopyPayload(row)}
                            >
                              {isCopied ? (
                                <Check className="text-emerald-500" />
                              ) : (
                                <Copy />
                              )}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              aria-label={`Ver mensaje completo del registro ${row.id}`}
                              title="Ver mensaje completo"
                              onClick={() => setInspectedRow(row)}
                            >
                              <PanelRightOpen />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {isExpanded && (
                        <TableRow className="bg-muted/25 hover:bg-muted/25">
                          <TableCell colSpan={6} className="p-0 whitespace-normal">
                            <div className="flex flex-col gap-3 px-4 py-3 sm:px-6">
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <span className="font-mono text-xs text-muted-foreground">
                                  Payload completo · Registro #{row.id}
                                </span>
                                <div className="flex items-center gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="xs"
                                    onClick={() => handleCopyPayload(row)}
                                  >
                                    {isCopied ? (
                                      <Check data-icon="inline-start" className="text-emerald-500" />
                                    ) : (
                                      <Copy data-icon="inline-start" />
                                    )}
                                    {isCopied ? 'Copiado' : 'Copiar JSON'}
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="xs"
                                    onClick={() => setInspectedRow(row)}
                                  >
                                    <PanelRightOpen data-icon="inline-start" />
                                    Abrir panel
                                  </Button>
                                </div>
                              </div>
                              <pre className="max-h-80 overflow-auto rounded-lg border bg-background/80 p-3 font-mono text-xs leading-relaxed whitespace-pre-wrap break-words text-foreground">
                                {formatPayloadJson(row.payload)}
                              </pre>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>

        {data.length > 0 && (
          <CardFooter className="flex flex-col gap-3 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span>
                Mostrando <strong className="text-foreground">{pagination.startIndex}</strong>–
                <strong className="text-foreground">{pagination.endIndex}</strong> de{' '}
                <strong className="text-foreground">{pagination.totalItems}</strong> registros
              </span>
              <div className="flex items-center gap-2">
                <span>Filas:</span>
                <Select value={String(pageSize)} onValueChange={handlePageSizeChange}>
                  <SelectTrigger size="sm" aria-label="Registros por página">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="start">
                    <SelectGroup>
                      {PAGE_SIZE_OPTIONS.map((option) => (
                        <SelectItem key={option} value={String(option)}>
                          {option}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {pagination.totalPages > 1 && (
              <Pagination className="mx-0 w-auto">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      text="Anterior"
                      aria-disabled={isFirstPage}
                      tabIndex={isFirstPage ? -1 : undefined}
                      className={
                        isFirstPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                      }
                      onClick={(e) => {
                        e.preventDefault();
                        if (!isFirstPage) {
                          handlePageChange(pagination.currentPage - 1);
                        }
                      }}
                    />
                  </PaginationItem>

                  {paginationTokens.map((token, index) =>
                    token === 'ellipsis' ? (
                      <PaginationItem key={`ellipsis-${index}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={token}>
                        <PaginationLink
                          href="#"
                          isActive={token === pagination.currentPage}
                          className="cursor-pointer"
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(token);
                          }}
                        >
                          {token}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      text="Siguiente"
                      aria-disabled={isLastPage}
                      tabIndex={isLastPage ? -1 : undefined}
                      className={
                        isLastPage ? 'pointer-events-none opacity-50' : 'cursor-pointer'
                      }
                      onClick={(e) => {
                        e.preventDefault();
                        if (!isLastPage) {
                          handlePageChange(pagination.currentPage + 1);
                        }
                      }}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </CardFooter>
        )}
      </Card>

      <Sheet
        open={inspectedRow !== null}
        onOpenChange={(open) => {
          if (!open) {
            setInspectedRow(null);
          }
        }}
      >
        <SheetContent side="right" className="flex flex-col gap-0 p-0 sm:max-w-xl">
          {inspectedRow && (
            <>
              <SheetHeader className="border-b p-5 pr-12">
                <SheetTitle className="font-mono text-base">
                  Registro #{inspectedRow.id}
                </SheetTitle>
                <SheetDescription>
                  Mensaje completo de telemetría almacenado en TimescaleDB.
                </SheetDescription>
              </SheetHeader>

              <div className="grid grid-cols-1 gap-3 border-b bg-muted/30 px-5 py-3 text-xs sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground">Origen</span>
                  <div>
                    <OriginBadge origin={inspectedRow.originType} />
                  </div>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground">Sensor ID</span>
                  <span className="truncate font-mono text-foreground">
                    {inspectedRow.sensorId}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground">Marca Temporal</span>
                  <span className="font-mono text-foreground">
                    {formatTimestamp(inspectedRow.recordedAt)}
                  </span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-muted-foreground">Recibido</span>
                  <span className="font-mono text-foreground">
                    {formatTimestamp(inspectedRow.receivedAt)}
                  </span>
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-3 overflow-hidden p-5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-muted-foreground">
                    Payload (JSON)
                  </span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopyPayload(inspectedRow)}
                  >
                    {copiedRowId === inspectedRow.id ? (
                      <Check data-icon="inline-start" className="text-emerald-500" />
                    ) : (
                      <Copy data-icon="inline-start" />
                    )}
                    {copiedRowId === inspectedRow.id ? 'Copiado' : 'Copiar JSON'}
                  </Button>
                </div>

                <pre className="flex-1 overflow-auto rounded-lg border bg-muted/40 p-4 font-mono text-xs leading-relaxed whitespace-pre-wrap break-words text-foreground">
                  {formatPayloadJson(inspectedRow.payload)}
                </pre>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
