'use client';

import { Button } from '@/components/ui/button';
import { tablePaginationNavButtonClassName } from '@/components/forms/form-tokens';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { Pagination } from '@/schemas';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import type { ColumnDef, PaginationState, SortingState, TableState, Updater } from '@tanstack/react-table';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  SearchX,
} from 'lucide-react';
import { parseAsString, parseAsStringEnum, useQueryState } from 'nuqs';
import { isValidElement, useMemo, useState, useTransition } from 'react';

type ControlledSorting = {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
};

interface SortingConfig {
  enabled?: boolean;
  controlled?: ControlledSorting;
}

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  pagination?: Pagination | null;
  sorting?: SortingConfig;
  emptyMessage?: string;
  loading?: boolean;
  toolbar?: React.ReactNode;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  /** Largura mínima da tabela em desktop (px). Use 0 para preencher o container. */
  minWidth?: number;
  getRowId?: (row: TData) => string;
  /**
   * IDs das colunas que devem aparecer em destaque no header do card mobile.
   * A primeira vira título, a segunda vira subtítulo. Se omitido, renderiza
   * todas as colunas como pares label/valor.
   */
  mobilePrimaryColumns?: [string, string?];
}

export function DataTable<TData>({
  columns,
  data,
  pagination,
  sorting,
  emptyMessage = 'Nenhum dado encontrado.',
  loading = false,
  toolbar,
  onPageChange,
  onPageSizeChange,
  minWidth = 640,
  getRowId,
  mobilePrimaryColumns,
}: DataTableProps<TData>) {
  const paginationEnabled = pagination !== null && pagination !== undefined;
  const isServerSidePagination = paginationEnabled && (!!onPageChange || !!onPageSizeChange);
  const isClientSidePagination = paginationEnabled && !isServerSidePagination;

  const sortingEnabled = !!sorting?.enabled;
  const controlledSorting = sorting?.controlled;
  const isServerSideSorting = sortingEnabled && !!controlledSorting;

  const pageSizeOptions = [10, 20, 50, 100];
  const initialPageSize = pagination?.limit ?? 10;

  const [, startTransition] = useTransition();

  const [sortBy, setSortBy] = useQueryState('sortBy', parseAsString.withOptions({ shallow: false, startTransition }));
  const [sortOrder, setSortOrder] = useQueryState(
    'sortOrder',
    parseAsStringEnum(['asc', 'desc']).withOptions({
      shallow: false,
      startTransition,
    }),
  );

  const [clientSorting, setClientSorting] = useState<SortingState>([]);
  const [filter, setFilter] = useState('');

  const [clientPaging, setClientPaging] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  });

  const currentSorting = useMemo(() => {
    if (isServerSideSorting && controlledSorting?.sortBy) {
      return [
        {
          id: controlledSorting.sortBy,
          desc: controlledSorting.sortOrder === 'desc',
        },
      ];
    }
    if (sortBy) {
      return [{ id: sortBy, desc: sortOrder === 'desc' }];
    }
    return clientSorting;
  }, [isServerSideSorting, controlledSorting, sortBy, sortOrder, clientSorting]);

  const serverPageIndex = pagination ? pagination.page - 1 : 0;
  const serverPageSize = pagination?.limit ?? 10;

  const tableState = useMemo(
    () =>
      ({
        sorting: currentSorting,
        globalFilter: filter,
        ...(isClientSidePagination ? { pagination: clientPaging } : {}),
        ...(isServerSidePagination
          ? {
              pagination: {
                pageIndex: serverPageIndex,
                pageSize: serverPageSize,
              },
            }
          : {}),
      }) as unknown as TableState,
    [
      currentSorting,
      filter,
      isClientSidePagination,
      isServerSidePagination,
      clientPaging,
      serverPageIndex,
      serverPageSize,
    ],
  );

  const handleSortingChange = (updaterOrValue: Updater<SortingState>) => {
    const newSorting = typeof updaterOrValue === 'function' ? updaterOrValue(currentSorting) : updaterOrValue;

    if (isServerSideSorting && controlledSorting?.onSortChange) {
      const sort = newSorting[0];
      if (sort) {
        controlledSorting.onSortChange(sort.id, sort.desc ? 'desc' : 'asc');
      }
    } else if (sortBy !== undefined) {
      const sort = newSorting[0];
      if (sort) {
        setSortBy(sort.id);
        setSortOrder(sort.desc ? 'desc' : 'asc');
      } else {
        setSortBy(null);
        setSortOrder(null);
      }
    } else {
      setClientSorting(newSorting);
    }
  };

  const table = useReactTable({
    data,
    columns,
    state: tableState,
    ...(getRowId ? { getRowId } : {}),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    ...(paginationEnabled ? { getPaginationRowModel: getPaginationRowModel() } : {}),
    onSortingChange: handleSortingChange,
    onGlobalFilterChange: setFilter,
    ...(isClientSidePagination ? { onPaginationChange: setClientPaging } : {}),
    ...(isServerSidePagination
      ? {
          manualPagination: true,
          pageCount: pagination?.totalPages ?? 1,
        }
      : {}),
  });

  const totalFiltered = isServerSidePagination ? (pagination?.total ?? 0) : table.getFilteredRowModel().rows.length;

  const pageIndex = paginationEnabled
    ? isServerSidePagination
      ? serverPageIndex
      : table.getState().pagination.pageIndex
    : 0;

  const pageSize = paginationEnabled
    ? isServerSidePagination
      ? serverPageSize
      : table.getState().pagination.pageSize
    : totalFiltered || data.length;

  const totalPages = isServerSidePagination ? (pagination?.totalPages ?? 1) : table.getPageCount() || 1;

  const canPreviousPage = pageIndex > 0;
  const canNextPage = isServerSidePagination ? !!pagination?.hasNextPage : table.getCanNextPage();

  const from = paginationEnabled && data.length > 0 ? pageIndex * pageSize + 1 : 0;
  const to = paginationEnabled
    ? isServerSidePagination
      ? pageIndex * pageSize + data.length
      : Math.min((pageIndex + 1) * pageSize, totalFiltered)
    : totalFiltered;

  const goToFirst = () => (isServerSidePagination ? onPageChange?.(1) : table.setPageIndex(0));
  const goToPrevious = () => (isServerSidePagination ? onPageChange?.(pageIndex) : table.previousPage());
  const goToNext = () => (isServerSidePagination ? onPageChange?.(pageIndex + 2) : table.nextPage());
  const goToLast = () =>
    isServerSidePagination ? onPageChange?.(pagination?.totalPages || 1) : table.setPageIndex(table.getPageCount() - 1);

  const handlePageSizeChange = (v: string | null) => {
    if (v == null) return;
    if (isServerSidePagination && onPageSizeChange) {
      onPageSizeChange(Number(v));
    } else {
      table.setPageSize(Number(v));
    }
  };

  return (
    <div className="relative flex flex-col gap-3">
      {toolbar && (
        <div className="flex items-center justify-end gap-2 rounded-xl bg-card p-3 shadow-sm ring-1 ring-foreground/10 md:hidden">
          {toolbar}
        </div>
      )}

      {/* ─── Desktop / Tablet (≥ md) ───────────────────────────────────── */}
      <div className="relative hidden overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-foreground/10 transition-all md:block">
        {toolbar && (
          <div className="flex items-center justify-end gap-2 border-b border-border/70 bg-muted/35 px-4 py-3 lg:px-5">
            {toolbar}
          </div>
        )}
        <div className="overflow-x-auto rounded-[inherit]">
          <Table className="border-separate border-spacing-0" style={minWidth > 0 ? { minWidth } : undefined}>
            <TableHeader className="sticky top-0 z-10 bg-surface-container-high/92 shadow-[inset_0_-1px_0_rgba(28,23,18,0.08)] backdrop-blur-sm">
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id} className="border-b border-border/70 hover:bg-transparent">
                  {hg.headers.map((header) => {
                    const isActionsColumn = header.id === 'actions';
                    const canSort = header.column.getCanSort();

                    return (
                      <TableHead
                        key={header.id}
                        className={cn(
                          'h-14 px-4 py-3 text-sm font-semibold tracking-[-0.01em] text-foreground/88 first:pl-5 last:pr-5 lg:h-16 lg:px-6 lg:py-4 lg:first:pl-7 lg:last:pr-7',
                          !isActionsColumn && 'min-w-[120px]',
                          canSort && 'cursor-pointer select-none transition-colors hover:text-foreground',
                          isActionsColumn && 'text-right w-[80px] min-w-[80px]',
                        )}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        <div className={cn('flex items-center gap-2', isActionsColumn && 'justify-end')}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {canSort &&
                            (header.column.getIsSorted() === 'asc' ? (
                              <ArrowUp className="h-3.5 w-3.5 text-primary" />
                            ) : header.column.getIsSorted() === 'desc' ? (
                              <ArrowDown className="h-3.5 w-3.5 text-primary" />
                            ) : (
                              <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/30" />
                            ))}
                        </div>
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="animate-pulse">
                    {columns.map((_, j) => (
                      <TableCell
                        key={j}
                        className="h-[64px] px-4 py-4 first:pl-5 last:pr-5 lg:h-[74px] lg:px-6 lg:py-5 lg:first:pl-7 lg:last:pr-7"
                      >
                        <Skeleton className="h-5 w-full rounded-lg" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : data.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    className="border-b border-border/60 odd:bg-background even:bg-background/30 hover:bg-foreground/[0.07] **:data-[slot=table-cell]:first:w-8"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="px-4 py-2.5 text-sm font-medium text-foreground/90 first:pl-5 last:pr-5 lg:px-6 lg:py-3 lg:first:pl-7 lg:last:pr-7"
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-[280px] text-center">
                    <div className="flex flex-col items-center justify-center gap-3 text-muted-foreground">
                      <div className="rounded-full border border-border/60 bg-muted/55 p-4">
                        <SearchX className="h-8 w-8 opacity-50" />
                      </div>
                      <p className="text-sm font-medium">{emptyMessage}</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {paginationEnabled && (
          <PaginationBar
            from={from}
            to={to}
            total={totalFiltered}
            pageIndex={pageIndex}
            totalPages={totalPages}
            pageSize={pageSize}
            pageSizeOptions={pageSizeOptions}
            canPrevious={canPreviousPage}
            canNext={canNextPage}
            disabled={loading}
            onFirst={goToFirst}
            onPrevious={goToPrevious}
            onNext={goToNext}
            onLast={goToLast}
            onPageSizeChange={handlePageSizeChange}
          />
        )}
      </div>

      {/* ─── Mobile (< md) ────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3 md:hidden">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse space-y-3 rounded-xl bg-card p-4 shadow-sm ring-1 ring-foreground/10">
              <div className="flex justify-between items-start">
                <Skeleton className="h-4 w-1/3 rounded" />
                <Skeleton className="h-4 w-1/4 rounded" />
              </div>
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-2/3 rounded" />
            </div>
          ))
        ) : data.length ? (
          table
            .getRowModel()
            .rows.map((row) => <MobileCard key={row.id} row={row} primaryColumnIds={mobilePrimaryColumns} />)
        ) : (
          <div className="flex h-[200px] flex-col items-center justify-center gap-3 rounded-xl bg-card p-6 text-center shadow-sm ring-1 ring-foreground/10">
            <SearchX className="h-10 w-10 text-muted-foreground opacity-30" />
            <p className="text-sm font-semibold text-muted-foreground">{emptyMessage}</p>
          </div>
        )}

        {paginationEnabled && (!loading || data.length > 0) && (
          <MobilePaginationBar
            from={from}
            to={to}
            total={totalFiltered}
            pageIndex={pageIndex}
            totalPages={totalPages}
            pageSize={pageSize}
            pageSizeOptions={pageSizeOptions}
            canPrevious={canPreviousPage}
            canNext={canNextPage}
            disabled={loading}
            onPrevious={goToPrevious}
            onNext={goToNext}
            onPageSizeChange={handlePageSizeChange}
          />
        )}
      </div>
    </div>
  );
}

// ─── Sub-componentes ─────────────────────────────────────────────────────

type PaginationBarProps = {
  from: number;
  to: number;
  total: number;
  pageIndex: number;
  totalPages: number;
  pageSize: number;
  pageSizeOptions: number[];
  canPrevious: boolean;
  canNext: boolean;
  disabled?: boolean;
  onFirst: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onLast: () => void;
  onPageSizeChange: (value: string | null) => void;
};

function PaginationBar({
  from,
  to,
  total,
  pageIndex,
  totalPages,
  pageSize,
  pageSizeOptions,
  canPrevious,
  canNext,
  disabled,
  onFirst,
  onPrevious,
  onNext,
  onLast,
  onPageSizeChange,
}: PaginationBarProps) {
  return (
    <div className="flex flex-col items-stretch justify-between gap-3 border-t border-border/60 bg-card px-4 py-3 md:flex-row md:items-center lg:px-5">
      <div className="flex items-center justify-between gap-4 md:justify-start">
        <div className="text-xs font-medium text-muted-foreground sm:text-sm">
          <span className="text-foreground font-bold">{from}</span>
          <span className="mx-1">–</span>
          <span className="text-foreground font-bold">{to}</span>
          <span className="mx-1">de</span>
          <span className="text-foreground font-bold">{total}</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground/75 sm:inline sm:text-xs">
            Linhas
          </span>
          <Select value={String(pageSize)} onValueChange={onPageSizeChange}>
            <SelectTrigger className="h-9 w-[72px] rounded-xl border-border/70 bg-background/80 text-xs font-semibold shadow-none ring-offset-background transition-colors hover:bg-background focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent
              align="center"
              className="rounded-lg border-border/70 bg-popover/95 shadow-xl backdrop-blur-sm"
            >
              {pageSizeOptions.map((opt) => (
                <SelectItem key={opt} value={String(opt)} className="text-xs font-medium">
                  {opt}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center justify-center gap-1.5 md:justify-end">
        <Button
          variant="outline"
          size="icon"
          className={cn(tablePaginationNavButtonClassName)}
          onClick={onFirst}
          disabled={!canPrevious || disabled}
          aria-label="Primeira página"
        >
          <ChevronsLeft className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className={cn(tablePaginationNavButtonClassName)}
          onClick={onPrevious}
          disabled={!canPrevious || disabled}
          aria-label="Página anterior"
        >
          <ChevronLeft className="size-4" />
        </Button>

        <div className="flex h-9 min-w-[110px] items-center justify-center rounded-xl border border-border/70 bg-muted/45 px-3 text-xs font-bold text-foreground">
          Página {pageIndex + 1} de {totalPages}
        </div>

        <Button
          variant="outline"
          size="icon"
          className={cn(tablePaginationNavButtonClassName)}
          onClick={onNext}
          disabled={!canNext || disabled}
          aria-label="Próxima página"
        >
          <ChevronRight className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className={cn(tablePaginationNavButtonClassName)}
          onClick={onLast}
          disabled={!canNext || disabled}
          aria-label="Última página"
        >
          <ChevronsRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

type MobilePaginationBarProps = Omit<PaginationBarProps, 'onFirst' | 'onLast'>;

function MobilePaginationBar({
  from,
  to,
  total,
  pageIndex,
  totalPages,
  pageSize,
  pageSizeOptions,
  canPrevious,
  canNext,
  disabled,
  onPrevious,
  onNext,
  onPageSizeChange,
}: MobilePaginationBarProps) {
  return (
    <div className="sticky bottom-3 z-10 flex items-center justify-between gap-2 rounded-xl bg-card px-3 py-2 shadow-lg ring-1 ring-foreground/10 backdrop-blur supports-[backdrop-filter]:bg-card/90">
      <Button
        variant="outline"
        size="icon"
        className={cn(tablePaginationNavButtonClassName, 'shrink-0')}
        onClick={onPrevious}
        disabled={!canPrevious || disabled}
        aria-label="Página anterior"
      >
        <ChevronLeft className="size-4" />
      </Button>

      <div className="flex min-w-0 flex-1 flex-col items-center gap-0.5 text-center">
        <span className="text-xs font-bold text-foreground">
          Página {pageIndex + 1} de {totalPages}
        </span>
        <span className="font-mono text-[10px] tabular-nums text-muted-foreground">
          {from}–{to} de {total}
        </span>
      </div>

      <Select value={String(pageSize)} onValueChange={onPageSizeChange}>
        <SelectTrigger className="h-9 w-[60px] shrink-0 rounded-xl border-border/70 bg-background/80 text-xs font-semibold shadow-none focus:ring-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent align="end" className="rounded-lg border-border/70 bg-popover/95">
          {pageSizeOptions.map((opt) => (
            <SelectItem key={opt} value={String(opt)} className="text-xs font-medium">
              {opt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="icon"
        className={cn(tablePaginationNavButtonClassName, 'shrink-0')}
        onClick={onNext}
        disabled={!canNext || disabled}
        aria-label="Próxima página"
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}

type Row = ReturnType<ReturnType<typeof useReactTable>['getRowModel']>['rows'][number];

function MobileCard({ row, primaryColumnIds }: { row: Row; primaryColumnIds?: [string, string?] }) {
  const cells = row.getVisibleCells();
  const actionsCell = cells.find((c) => c.column.id === 'actions');
  const dataCells = cells.filter((c) => c.column.id !== 'actions');

  const titleCell = primaryColumnIds ? dataCells.find((c) => c.column.id === primaryColumnIds[0]) : undefined;
  const subtitleCell =
    primaryColumnIds && primaryColumnIds[1] ? dataCells.find((c) => c.column.id === primaryColumnIds[1]) : undefined;

  const detailCells = dataCells.filter((c) => c !== titleCell && c !== subtitleCell);

  return (
    <article className="group relative rounded-xl bg-card p-4 shadow-sm ring-1 ring-foreground/10 transition-all active:scale-[0.99]">
      {(titleCell || subtitleCell) && (
        <header className="mb-3 flex items-start justify-between gap-3 border-b border-border/40 pb-3">
          <div className="min-w-0 flex-1">
            {titleCell ? (
              <div className="truncate text-sm font-semibold leading-tight text-foreground">
                {flexRender(titleCell.column.columnDef.cell, titleCell.getContext())}
              </div>
            ) : null}
            {subtitleCell ? (
              <div className="mt-0.5 truncate text-xs text-muted-foreground">
                {flexRender(subtitleCell.column.columnDef.cell, subtitleCell.getContext())}
              </div>
            ) : null}
          </div>
          {actionsCell ? (
            <div className="shrink-0">{flexRender(actionsCell.column.columnDef.cell, actionsCell.getContext())}</div>
          ) : null}
        </header>
      )}

      {detailCells.length > 0 ? (
        <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5">
          {detailCells.map((cell) => {
            const header = cell.column.columnDef.header;
            const label = typeof header === 'string' ? header : isValidElement(header) ? null : null;
            return (
              <div key={cell.id} className="flex min-w-0 flex-col gap-0.5">
                {label ? (
                  <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 leading-none">
                    {label}
                  </dt>
                ) : null}
                <dd className="truncate text-sm font-medium text-foreground/90">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </dd>
              </div>
            );
          })}
        </dl>
      ) : null}

      {actionsCell && !titleCell && !subtitleCell ? (
        <footer className="mt-3 flex justify-end border-t border-dashed border-border/60 pt-3">
          {flexRender(actionsCell.column.columnDef.cell, actionsCell.getContext())}
        </footer>
      ) : null}
    </article>
  );
}
