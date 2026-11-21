​// type.data-view.tsx
// Virtualized table, list and card layouts for TanStack table data.

'use client';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type Column,
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnPinningState,
  type InitialTableState,
  type OnChangeFn,
  type PaginationState,
  type Row,
  type RowData,
  type RowSelectionState,
  type SortingState,
  type Table,
  type VisibilityState,
} from '@tanstack/react-table';
import { useVirtualizer, type VirtualItem } from '@tanstack/react-virtual';
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Columns3,
  PinOff,
  Search,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type RefObject } from 'react';

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    /** Tailwind/DaisyUI classes added to this column's header and cells, e.g. "text-center". */
    className?: string;
  }
}

/* ---------- Types ---------- */

/**
 * How the records are laid out. Each one maps to a TanStack Virtual setup.
 * - `rows`: a table, one record per row, scrolls vertically.
 * - `list`: a DaisyUI list, one full-width item per record, scrolls vertically.
 * - `columns`: cards side by side in one strip, scrolls horizontally.
 * - `grid-vertical`: cards of equal size in a grid, scrolls vertically.
 * - `masonry-vertical`: cards in lanes, each as tall as its content, scrolls vertically.
 * - `masonry-horizontal`: cards in lanes, widths from `estimateSize`, scrolls horizontally.
 */
export type TypeDataViewView =
  | 'rows'
  | 'list'
  | 'columns'
  | 'grid-vertical'
  | 'masonry-vertical'
  | 'masonry-horizontal';

/** Every text the component shows. Pass `labels` with the ones you want to translate or change. */
export const TYPE_DATA_VIEW_LABELS = {
  search: 'Search...',
  filter: 'Filter...',
  sortBy: 'Sort by...',
  sortDirection: 'Toggle sort direction',
  columns: 'Columns',
  reset: 'Reset',
  selectAll: 'Select all rows',
  selectRow: 'Select row',
  rowsPerPage: 'Rows per page',
  perPage: (size: number) => `${size} / page`,
  page: (current: number, total: number) => `Page ${current}/${total}`,
  selected: (count: number) => `${count} selected`,
  firstPage: 'First page',
  previousPage: 'Previous page',
  nextPage: 'Next page',
  lastPage: 'Last page',
  pinLeft: 'Pin left',
  pinRight: 'Pin right',
  unpin: 'Unpin',
};
export type TypeDataViewLabels = typeof TYPE_DATA_VIEW_LABELS;

export type TypeDataViewProps<T> = {
  /* ---------- Data ---------- */
  /** The rows to show. */
  data: T[];
  /** TanStack column definitions. They drive the table columns and the default card content. */
  columns: ColumnDef<T, any>[]; // eslint-disable-line @typescript-eslint/no-explicit-any
  /** Stable id per row. Needed for selection to survive paging. Defaults to the index. */
  getRowId?: (row: T, index: number) => string;
  /**
   * "server" (default): `data` is the current page; you sort, filter and page it yourself and pass `rowCount`.
   * "client": `data` holds every record and the view sorts, filters and pages it.
   */
  rendering?: 'client' | 'server';
  /** Total number of records. Needed with `rendering="server"` to know how many pages there are. */
  rowCount?: number;
  /**
   * Starting state when you don't control it. Supports `sorting`, `pagination`, `columnVisibility`,
   * `columnPinning`, `columnFilters` and `globalFilter`.
   */
  initialState?: InitialTableState;

  /* ---------- Layout ---------- */
  /**
   * "table": always the table. "card": always cards. "list": always the list.
   * Leave it out for automatic: table on desktop, cards below 768px.
   */
  layout?: 'table' | 'card' | 'list';
  /**
   * How records are arranged. Default "rows" (the table). Used as the card arrangement
   * when it is not "rows"; the cards then default to "masonry-vertical".
   * Only "rows" has column headers, sorting arrows and checkboxes.
   */
  view?: TypeDataViewView;
  /** Number of lanes (grid/masonry columns, or rows for "masonry-horizontal"). Default: fits the container. */
  lanes?: number;
  /** Custom card. What you return is the whole card. Without it, a default card lists the columns. */
  renderCard?: (row: T, tableRow: Row<T>) => React.ReactNode;
  /**
   * Custom list item. What you return goes inside a DaisyUI `list-row`, so its children become the
   * list columns (use `list-col-grow` on the one that should fill the space).
   * Without it, the visible columns are shown side by side.
   */
  renderListItem?: (row: T, tableRow: Row<T>) => React.ReactNode;
  /** Height of the scroll area in px or any CSS value, "fill" for a flex-column parent, or "auto" for the content. Default "fill". */
  height?: number | string;
  /**
   * Size along the scroll axis in px: row height (measured, so this is only the first guess),
   * card height for "grid-vertical" and "masonry-vertical", card width for "columns" and "masonry-horizontal".
   * Pass a function to give each item its own size. Default 48 / 72 / 300 / 280.
   */
  estimateSize?: number | ((index: number) => number);
  /** Extra items rendered above and below the visible area. Default 8. */
  overscan?: number;
  /** Keep the table header visible while scrolling. Default true. */
  stickyHeader?: boolean;

  /* ---------- Paging ---------- */
  /** Pass it to page the data with a footer (page size, page buttons, Page N/N). Leave it out for no paging options at all: all rows scroll (virtualized). */
  pagination?: PaginationState;
  onPaginationChange?: OnChangeFn<PaginationState>;
  pageSizeOptions?: number[];

  /* ---------- Sorting ---------- */
  /** Sorting is on only when `sorting` or `onSortingChange` is passed. Otherwise there are no sort icons and headers are not clickable. */
  sorting?: SortingState;
  onSortingChange?: OnChangeFn<SortingState>;

  /* ---------- Filtering ---------- */
  /** Search box in the toolbar. In "client" rendering it filters every column. */
  enableGlobalFilter?: boolean;
  globalFilter?: string;
  onGlobalFilterChange?: OnChangeFn<string>;
  /** A filter input under each column header ("rows" view). */
  enableColumnFilters?: boolean;
  columnFilters?: ColumnFiltersState;
  onColumnFiltersChange?: OnChangeFn<ColumnFiltersState>;

  /* ---------- Columns ---------- */
  /** "Columns" menu in the toolbar to show or hide columns. Default true. */
  showColumnsMenu?: boolean;
  columnVisibility?: VisibilityState;
  onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
  /** Pin columns to the left or right edge, from the "Columns" menu ("rows" view). */
  enableColumnPinning?: boolean;
  columnPinning?: ColumnPinningState;
  onColumnPinningChange?: OnChangeFn<ColumnPinningState>;
  /** Drag header edges to resize columns ("rows" view). */
  enableColumnResizing?: boolean;

  /* ---------- Selection ---------- */
  /** A checkbox on every row or card. Pass a function to allow it only for some rows. */
  enableRowSelection?: boolean | ((row: Row<T>) => boolean);
  /** Allow more than one selected row. Default true. */
  enableMultiRowSelection?: boolean;
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;
  /**
   * Called with the selected row objects whenever the selection changes. With server paging it only has
   * the rows of the current page; use `rowSelection` (ids) to keep the selection from every page.
   */
  onSelectedRowsChange?: (rows: T[]) => void;

  /* ---------- Events ---------- */
  onRowClick?: (row: T) => void;
  /** Called when the user scrolls near the end of the list. Use it to load more. */
  onEndReached?: () => void;
  /** How many items from the end counts as "near". Default 10. */
  endReachedThreshold?: number;

  /* ---------- Look and text ---------- */
  /** Shows DaisyUI skeleton placeholders (shimmer) in place of the rows or cards. */
  loading?: boolean;
  /** How many skeleton rows (or cards) to show. Default 10 rows, or 2 per lane for cards. */
  skeletonCount?: number;
  emptyMessage?: React.ReactNode;
  /** Replace any of the built-in texts, for translations. */
  labels?: Partial<TypeDataViewLabels>;
  /** Extra classes for a row (and for the card wrapper). */
  getRowClassName?: (row: T) => string;
  /** Your own controls in the toolbar. Receives the TanStack table instance. */
  renderToolbar?: (table: Table<T>) => React.ReactNode;
  /** Wrapper classes. */
  className?: string;
  /** DaisyUI/Tailwind classes added to the `<table>`, e.g. "table-zebra table-sm". "rows" view only. */
  tableClassName?: string;
};

/* ---------- Helpers and hooks ---------- */

const SKELETON_ROWS = 10;
const CARD_MIN_WIDTH = 280;
const CARD_MIN_HEIGHT = 200;
const MOBILE_QUERY = '(max-width: 767px)';
const DEFAULT_SIZE: Record<TypeDataViewView, number> = {
  rows: 48,
  list: 72,
  columns: 280,
  'grid-vertical': 300,
  'masonry-vertical': 300,
  'masonry-horizontal': 280,
};

type Labels = TypeDataViewLabels;

/** Joins the class names that are set. */
const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ');

const columnTitle = <T,>(column: Column<T, unknown>) =>
  typeof column.columnDef.header === 'string' && column.columnDef.header ? column.columnDef.header : column.id;

/** Sticky offsets for columns pinned to the left or right edge. */
function pinStyle<T>(column: Column<T, unknown>): React.CSSProperties {
  const side = column.getIsPinned();
  if (!side) return {};
  return {
    position: 'sticky',
    left: side === 'left' ? column.getStart('left') : undefined,
    right: side === 'right' ? column.getAfter('right') : undefined,
    zIndex: 5,
  };
}

/** The layout to draw, from `layout` (forced), `view` (the arrangement) and the screen size (automatic). */
function resolveView(layout: TypeDataViewProps<unknown>['layout'], view: TypeDataViewView, isMobile: boolean) {
  if (layout === 'table') return 'rows';
  if (layout === 'list') return 'list';
  return layout === 'card' || (!layout && isMobile) ? (view === 'rows' ? 'masonry-vertical' : view) : view;
}

function useIsMobile(): boolean {
  return useSyncExternalStore(
    (notify) => {
      const mq = window.matchMedia(MOBILE_QUERY);
      mq.addEventListener('change', notify);
      return () => mq.removeEventListener('change', notify);
    },
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false
  );
}

/** State that follows `value` when the parent passes it, and is kept here otherwise. */
function useControlled<V>(value: V | undefined, initial: V) {
  const [inner, setInner] = useState(initial);
  return [value ?? inner, setInner] as const;
}

/** Width and height of an element, kept up to date while it resizes. */
function useSize(ref: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([{ contentRect: r }]) =>
      setSize((s) => (s.width === r.width && s.height === r.height ? s : { width: r.width, height: r.height }))
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);
  return size;
}

/** Calls `onEndReached` once per distinct row count while the end of the list is visible. */
function useEndReached(reached: boolean, count: number, onEndReached?: () => void) {
  const firedFor = useRef(-1);
  useEffect(() => {
    if (reached && firedFor.current !== count) {
      firedFor.current = count;
      onEndReached?.();
    }
  }, [reached, count, onEndReached]);
}

/** The leading checkbox column of the table. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function selectColumn<T>(multiple: boolean, labels: Labels): ColumnDef<T, any> {
  return {
    id: 'select',
    size: 44,
    enableSorting: false,
    enableHiding: false,
    enableColumnFilter: false,
    enableGlobalFilter: false,
    meta: { className: 'w-11' },
    header: ({ table }) =>
      multiple ? (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          indeterminate={table.getIsSomePageRowsSelected()}
          onChange={table.getToggleAllPageRowsSelectedHandler()}
          label={labels.selectAll}
        />
      ) : null,
    cell: ({ row }) => <RowCheckbox row={row} label={labels.selectRow} />,
  };
}

/* ---------- TypeDataView ---------- */

export function TypeDataView<T>({
  // data
  data,
  columns,
  getRowId,
  rendering = 'server',
  rowCount,
  initialState,
  // layout
  view: viewProp = 'rows',
  layout,
  lanes: lanesProp,
  renderCard,
  renderListItem,
  height = 'fill',
  estimateSize,
  overscan = 8,
  stickyHeader = true,
  // paging and sorting
  pagination,
  onPaginationChange,
  pageSizeOptions = [25, 50, 75, 100],
  sorting: sortingProp,
  onSortingChange,
  // filtering
  enableGlobalFilter = false,
  globalFilter: globalFilterProp,
  onGlobalFilterChange,
  enableColumnFilters = false,
  columnFilters: columnFiltersProp,
  onColumnFiltersChange,
  // columns
  showColumnsMenu = true,
  columnVisibility: columnVisibilityProp,
  onColumnVisibilityChange,
  enableColumnPinning = false,
  columnPinning: columnPinningProp,
  onColumnPinningChange,
  enableColumnResizing = false,
  // selection
  enableRowSelection = false,
  enableMultiRowSelection = true,
  rowSelection: rowSelectionProp,
  onRowSelectionChange,
  onSelectedRowsChange,
  // events
  onRowClick,
  onEndReached,
  endReachedThreshold = 10,
  // look and text
  loading = false,
  skeletonCount,
  emptyMessage = 'No data',
  labels: labelsProp,
  getRowClassName,
  renderToolbar,
  className = '',
  tableClassName = '',
}: TypeDataViewProps<T>) {
  const labels = useMemo(() => ({ ...TYPE_DATA_VIEW_LABELS, ...labelsProp }), [labelsProp]);
  const isMobile = useIsMobile();
  const view = resolveView(layout, viewProp, isMobile);
  const isRows = view === 'rows';
  const horizontal = view === 'columns' || view === 'masonry-horizontal';
  // Rows, list items and masonry-vertical cards are measured; the other views use the sizes given.
  const measured = isRows || view === 'list' || view === 'masonry-vertical';
  const server = rendering === 'server';
  const selectable = !!enableRowSelection;
  // Paging (and its footer) is on only when `pagination` is passed.
  const paged = !!pagination || !!initialState?.pagination;
  const sortable = sortingProp !== undefined || onSortingChange !== undefined || initialState?.sorting !== undefined;

  // Each piece of state follows its prop when it is passed, and is kept here otherwise.
  const [sorting, setSorting] = useControlled(sortingProp, initialState?.sorting ?? []);
  const [rowSelection, setRowSelection] = useControlled(rowSelectionProp, initialState?.rowSelection ?? {});
  const [pageState, setPageState] = useControlled(pagination, {
    pageIndex: 0,
    pageSize: pageSizeOptions[0],
    ...initialState?.pagination,
  });
  const [globalFilter, setGlobalFilter] = useControlled(globalFilterProp, (initialState?.globalFilter as string) ?? '');
  const [columnFilters, setColumnFilters] = useControlled(columnFiltersProp, initialState?.columnFilters ?? []);
  const [columnVisibility, setColumnVisibility] = useControlled(
    columnVisibilityProp,
    initialState?.columnVisibility ?? {}
  );
  const [columnPinning, setColumnPinning] = useControlled(columnPinningProp, initialState?.columnPinning ?? {});

  const allColumns = useMemo(
    () => (selectable && isRows ? [selectColumn<T>(enableMultiRowSelection, labels), ...columns] : columns),
    [columns, selectable, isRows, enableMultiRowSelection, labels]
  );

  const table = useReactTable({
    data,
    columns: allColumns,
    state: {
      sorting,
      rowSelection,
      globalFilter,
      columnFilters,
      columnVisibility,
      columnPinning,
      ...(paged ? { pagination: pageState } : {}),
    },
    onSortingChange: onSortingChange ?? setSorting,
    onRowSelectionChange: onRowSelectionChange ?? setRowSelection,
    onPaginationChange: onPaginationChange ?? setPageState,
    onGlobalFilterChange: onGlobalFilterChange ?? setGlobalFilter,
    onColumnFiltersChange: onColumnFiltersChange ?? setColumnFilters,
    onColumnVisibilityChange: onColumnVisibilityChange ?? setColumnVisibility,
    onColumnPinningChange: onColumnPinningChange ?? setColumnPinning,
    enableSorting: sortable,
    // The parent sorts by one column, and "no sort" would leave the server default order with no arrow.
    enableMultiSort: false,
    enableSortingRemoval: false,
    enableGlobalFilter,
    enableColumnFilters,
    enableHiding: showColumnsMenu,
    enableColumnPinning,
    enableColumnResizing,
    columnResizeMode: 'onChange',
    manualSorting: server,
    manualFiltering: server,
    manualPagination: server && paged,
    rowCount: server ? rowCount : undefined,
    // Without a total, the page count is unknown (-1) and "next" stays enabled.
    pageCount: server && paged && rowCount === undefined ? -1 : undefined,
    enableRowSelection,
    enableMultiRowSelection,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: server ? undefined : getSortedRowModel(),
    getFilteredRowModel: server ? undefined : getFilteredRowModel(),
    getPaginationRowModel: paged && !server ? getPaginationRowModel() : undefined,
  });

  const rows = table.getRowModel().rows;
  const selectedRows = table.getSelectedRowModel().rows;

  // Report the selected row objects to the parent.
  useEffect(() => {
    onSelectedRowsChange?.(selectedRows.map((r) => r.original));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowSelection]);

  // Virtualization. Lanes follow the size of the scroll area unless `lanes` is given.
  const scrollRef = useRef<HTMLDivElement>(null);
  const box = useSize(scrollRef);
  const autoLanes =
    view === 'masonry-horizontal'
      ? box.height / CARD_MIN_HEIGHT
      : view === 'grid-vertical' || view === 'masonry-vertical'
        ? (isMobile ? 1 : box.width / CARD_MIN_WIDTH)
        : 1;
  const lanes = isRows || view === 'list' || view === 'columns' ? 1 : Math.max(1, Math.floor(lanesProp ?? autoLanes));
  const sizeOf = useCallback(
    (i: number) => (typeof estimateSize === 'function' ? estimateSize(i) : (estimateSize ?? DEFAULT_SIZE[view])),
    [estimateSize, view]
  );
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    horizontal,
    lanes,
    estimateSize: sizeOf,
    overscan,
  });
  const items = virtualizer.getVirtualItems();
  const lastIndex = items.length ? items[items.length - 1].index : -1;
  useEndReached(
    !!onEndReached && !loading && rows.length > 0 && lastIndex >= rows.length - endReachedThreshold,
    rows.length,
    onEndReached
  );

  // Back to the top whenever the page, sort order or filters change.
  const resetKey = JSON.stringify([sorting, globalFilter, columnFilters]);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, left: 0 });
  }, [pageState.pageIndex, resetKey, view]);

  const fill = height === 'fill';
  const autoHeight = height === 'auto';
  const totalSize = virtualizer.getTotalSize();
  const cardSortable = !isRows && table.getAllLeafColumns().some((c) => c.getCanSort());
  // Everything the views need.
  const v: ViewProps<T> = {
    table,
    labels,
    rows,
    items,
    horizontal,
    measured,
    lanes,
    sizeOf,
    selectable,
    loading,
    stickyHeader,
    tableClassName,
    total: virtualizer.getTotalSize(),
    measure: virtualizer.measureElement,
    skeletonCount: skeletonCount ?? (isRows || view === 'list' ? SKELETON_ROWS : horizontal ? lanes * 4 : lanes * 2),
    resizable: enableColumnResizing,
    filterable: enableColumnFilters,
    onRowClick,
    getRowClassName,
    renderCard,
    renderListItem,
  };

  return (
    <div className={cx('flex flex-col gap-2', fill && 'min-h-0 flex-1', className)}>
      {enableGlobalFilter || showColumnsMenu || cardSortable || renderToolbar ? (
        <div className="flex flex-wrap items-center justify-between gap-2 py-2">
          {enableGlobalFilter ? (
            <label className="input input-sm flex w-full flex-1 items-center gap-2">
              <Search size={14} className="opacity-60" />
              <input
                type="search"
                className="grow"
                placeholder={labels.search}
                value={globalFilter ?? ''}
                onChange={(e) => table.setGlobalFilter(e.target.value)}
              />
            </label>
          ) : (
            <span />
          )}
          <div className="flex flex-wrap items-center gap-2">
            {renderToolbar?.(table)}
            {cardSortable ? <CardSortBar table={table} labels={labels} /> : null}
            {showColumnsMenu ? (
              <ColumnMenu table={table} labels={labels} pinnable={enableColumnPinning && isRows} />
            ) : null}
          </div>
        </div>
      ) : null}

      <div
        ref={scrollRef}
        className={cx(
          'relative overflow-auto rounded-box border border-base-300 bg-base-100',
          fill && 'min-h-0 flex-1'
        )}
        style={fill ? undefined : autoHeight ? { height: totalSize } : { height }}
      >
        {isRows ? (
          <TableView {...v} />
        ) : loading ? (
          <SkeletonCards {...v} />
        ) : view === 'list' ? (
          <ListView {...v} />
        ) : (
          <CardsView {...v} />
        )}
        {!loading && rows.length === 0 ? (
          <div className="py-10 text-center text-base-content/60">{emptyMessage}</div>
        ) : null}
      </div>

      {paged || selectable ? (
        <Footer
          table={table}
          labels={labels}
          pageSize={paged ? { current: pageState.pageSize, options: pageSizeOptions } : undefined}
          selectedCount={selectable ? Object.values(rowSelection).filter(Boolean).length : undefined}
        />
      ) : null}
    </div>
  );
}

/* ---------- Views (what goes inside the scroll area) ---------- */

/** Everything the views need, so each one takes the same props. */
type ViewProps<T> = {
  table: Table<T>;
  labels: Labels;
  rows: Row<T>[];
  items: VirtualItem[];
  /** Size of all items along the scroll axis, in px. */
  total: number;
  /** The virtualizer's `measureElement`, used as the `ref` of every measured item. */
  measure: (node: Element | null) => void;
  sizeOf: (index: number) => number;
  horizontal: boolean;
  measured: boolean;
  lanes: number;
  selectable: boolean;
  loading: boolean;
  skeletonCount: number;
  stickyHeader: boolean;
  resizable: boolean;
  filterable: boolean;
  tableClassName: string;
  onRowClick?: (row: T) => void;
  getRowClassName?: (row: T) => string;
  renderCard?: (row: T, tableRow: Row<T>) => React.ReactNode;
  renderListItem?: (row: T, tableRow: Row<T>) => React.ReactNode;
};

/** Classes for rows and cards that can be clicked. */
const CLICKABLE = 'cursor-pointer focus-visible:outline-2 focus-visible:outline-primary';

/** Click and keyboard (Enter, Space) handlers for a row or card, when `onRowClick` is set. */
const onClickOf = <T,>(row: Row<T>, onRowClick?: (row: T) => void) =>
  onRowClick
    ? {
        tabIndex: 0,
        onClick: () => onRowClick(row.original),
        onKeyDown: (e: React.KeyboardEvent) => {
          // Keys pressed on a button or input inside the row belong to that control.
          if (e.target !== e.currentTarget || (e.key !== 'Enter' && e.key !== ' ')) return;
          e.preventDefault();
          onRowClick(row.original);
        },
      }
    : undefined;

function TableView<T>({
  table,
  labels,
  rows,
  items,
  total,
  measure,
  loading,
  skeletonCount,
  onRowClick,
  getRowClassName,
  stickyHeader,
  tableClassName,
  resizable,
  filterable,
}: ViewProps<T>) {
  const visible = table.getVisibleLeafColumns();
  const paddingTop = items.length ? items[0].start : 0;
  const paddingBottom = items.length ? total - items[items.length - 1].end : 0;
  const spacer = (height: number) => (
    <tr aria-hidden style={{ height }}>
      <td colSpan={visible.length} className="p-0" />
    </tr>
  );

  return (
    <table
      className={cx('table', stickyHeader && 'table-pin-rows', tableClassName)}
      style={resizable ? { width: table.getTotalSize(), minWidth: '100%', tableLayout: 'fixed' } : undefined}
    >
      <thead>
        {table.getHeaderGroups().map((group) => (
          <tr key={group.id}>
            {group.headers.map((header) => {
              const column = header.column;
              const canSort = column.getCanSort();
              const sorted = column.getIsSorted();
              const pinned = column.getIsPinned();
              const fixedWidth = resizable || pinned || column.columnDef.size !== undefined;
              return (
                <th
                  key={header.id}
                  colSpan={header.colSpan}
                  style={{ ...(fixedWidth ? { width: header.getSize() } : {}), ...pinStyle(column) }}
                  className={cx(
                    'relative',
                    pinned && 'bg-base-100',
                    column.columnDef.meta?.className,
                    canSort && 'cursor-pointer select-none'
                  )}
                  aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined}
                  onClick={column.getToggleSortingHandler()}
                >
                  {header.isPlaceholder ? null : (
                    <span className="inline-flex items-center gap-1">
                      {flexRender(column.columnDef.header, header.getContext())}
                      {canSort ? <SortIcon sorted={sorted} /> : null}
                    </span>
                  )}
                  {resizable && column.getCanResize() ? (
                    <div
                      role="separator"
                      aria-orientation="vertical"
                      onClick={(e) => e.stopPropagation()}
                      onDoubleClick={() => column.resetSize()}
                      onMouseDown={header.getResizeHandler()}
                      onTouchStart={header.getResizeHandler()}
                      className={cx(
                        'absolute right-0 top-0 h-full w-1.5 cursor-col-resize touch-none select-none hover:bg-primary/60',
                        column.getIsResizing() && 'bg-primary'
                      )}
                    />
                  ) : null}
                </th>
              );
            })}
          </tr>
        ))}
        {filterable ? (
          <tr>
            {visible.map((column) => (
              <th
                key={column.id}
                className={cx('py-1 font-normal', column.getIsPinned() && 'bg-base-100')}
                style={{ ...(column.getIsPinned() ? { width: column.getSize() } : {}), ...pinStyle(column) }}
              >
                {column.getCanFilter() ? (
                  <input
                    className="input input-xs w-full"
                    placeholder={labels.filter}
                    aria-label={`${labels.filter} ${column.id}`}
                    value={(column.getFilterValue() as string) ?? ''}
                    onChange={(e) => column.setFilterValue(e.target.value || undefined)}
                  />
                ) : null}
              </th>
            ))}
          </tr>
        ) : null}
      </thead>
      <tbody>
        {loading ? (
          Array.from({ length: skeletonCount }, (_, r) => (
            <tr key={`sk-${r}`} aria-hidden>
              {visible.map((column) => (
                <td key={column.id}>
                  <div className="skeleton h-4 w-full max-w-40" />
                </td>
              ))}
            </tr>
          ))
        ) : (
          <>
            {paddingTop > 0 ? spacer(paddingTop) : null}
            {items.map((item) => {
              const row = rows[item.index];
              return (
                <tr
                  key={row.id}
                  data-index={item.index}
                  ref={measure}
                  className={cx(
                    'hover:bg-base-200',
                    row.getIsSelected() && 'bg-primary/10',
                    onRowClick && CLICKABLE,
                    getRowClassName?.(row.original)
                  )}
                  {...onClickOf(row, onRowClick)}
                >
                  {row.getVisibleCells().map((cell) => {
                    const pinned = cell.column.getIsPinned();
                    return (
                      <td
                        key={cell.id}
                        className={cx('max-w-64 truncate whitespace-nowrap', pinned && 'bg-base-100', cell.column.columnDef.meta?.className)}
                        title={String(cell.getValue() ?? '')}
                        style={pinned ? { width: cell.column.getSize(), ...pinStyle(cell.column) } : undefined}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {paddingBottom > 0 ? spacer(paddingBottom) : null}
          </>
        )}
      </tbody>
    </table>
  );
}

function ListView<T>({
  labels,
  rows,
  items,
  total,
  measure,
  selectable,
  onRowClick,
  getRowClassName,
  renderListItem,
}: ViewProps<T>) {
  return (
    <ul className="list relative" style={{ height: total }}>
      {items.map((item) => {
        const row = rows[item.index];
        return (
          <li
            key={row.id}
            data-index={item.index}
            ref={measure}
            className={cx(
              'list-row absolute left-0 top-0 w-full',
              row.getIsSelected() ? 'bg-primary/10' : 'hover:bg-base-200',
              onRowClick && CLICKABLE,
              getRowClassName?.(row.original)
            )}
            style={{ transform: `translateY(${item.start}px)` }}
            {...onClickOf(row, onRowClick)}
          >
            {renderListItem ? (
              renderListItem(row.original, row)
            ) : (
              <>
                {selectable ? <RowCheckbox row={row} label={labels.selectRow} /> : null}
                {row.getVisibleCells().map((cell, i) => (
                  <div key={cell.id} className={cx('min-w-0 text-sm', i === 0 && 'list-col-grow')}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                ))}
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}

function CardsView<T>({
  labels,
  rows,
  items,
  total,
  measure,
  horizontal,
  measured,
  lanes,
  sizeOf,
  selectable,
  onRowClick,
  getRowClassName,
  renderCard,
}: ViewProps<T>) {
  return (
    <div className="relative" style={horizontal ? { width: total, height: '100%' } : { height: total, width: '100%' }}>
      {items.map((item) => {
        const row = rows[item.index];
        const lane = `${(item.lane * 100) / lanes}%`;
        const laneSize = `${100 / lanes}%`;
        const size = sizeOf(item.index);
        return (
          <div
            key={row.id}
            data-index={item.index}
            ref={measured ? measure : undefined}
            className="absolute left-0 top-0 p-2"
            style={
              horizontal
                ? { top: lane, height: laneSize, width: size, transform: `translateX(${item.start}px)` }
                : {
                    left: lane,
                    width: laneSize,
                    height: measured ? undefined : size,
                    transform: `translateY(${item.start}px)`,
                  }
            }
          >
            <div
              className={cx(!measured && 'h-full', onRowClick && CLICKABLE, getRowClassName?.(row.original))}
              {...onClickOf(row, onRowClick)}
            >
              {renderCard ? (
                renderCard(row.original, row)
              ) : (
                <div
                  className={cx(
                    'card card-border relative bg-base-100',
                    !measured && 'h-full overflow-auto',
                    row.getIsSelected() ? 'border-primary bg-primary/10' : 'border-base-300'
                  )}
                >
                  <div className="card-body grid grid-cols-1 gap-x-4 gap-y-3 p-4 min-[480px]:grid-cols-2">
                    {selectable ? (
                      <div className="absolute right-3 top-3">
                        <RowCheckbox row={row} label={labels.selectRow} />
                      </div>
                    ) : null}
                    {row.getVisibleCells().map((cell) => {
                      const header = cell.column.columnDef.header;
                      return (
                        <div
                          key={cell.id}
                          className="min-w-0 truncate text-sm"
                          title={String(cell.getValue() ?? '')}
                        >
                          {typeof header === 'string' && header ? (
                            <div className="text-xs uppercase text-base-content/60">{header}</div>
                          ) : null}
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** Placeholders shown instead of the list or cards while loading. */
function SkeletonCards<T>({ horizontal, lanes, sizeOf, skeletonCount }: ViewProps<T>) {
  const size = sizeOf(0);
  return (
    <div
      aria-hidden
      className="grid gap-4 p-2"
      style={
        horizontal
          ? { height: '100%', gridAutoFlow: 'column', gridTemplateRows: `repeat(${lanes}, 1fr)`, gridAutoColumns: size }
          : { gridTemplateColumns: `repeat(${lanes}, 1fr)`, gridAutoRows: size }
      }
    >
      {Array.from({ length: skeletonCount }, (_, i) => (
        <div key={i} className="skeleton h-full w-full rounded-box" />
      ))}
    </div>
  );
}

/* ---------- Toolbar and footer ---------- */

/** Cards have no header row, so sorting is picked from a menu. */
function CardSortBar<T>({ table, labels }: { table: Table<T>; labels: Labels }) {
  const current = table.getState().sorting[0];
  return (
    <div className="join">
      <select
        aria-label={labels.sortBy}
        className="select select-sm join-item w-auto"
        value={current?.id ?? ''}
        onChange={(e) => table.setSorting(e.target.value ? [{ id: e.target.value, desc: !!current?.desc }] : [])}
      >
        <option value="">{labels.sortBy}</option>
        {table
          .getAllLeafColumns()
          .filter((c) => c.getCanSort())
          .map((c) => (
            <option key={c.id} value={c.id}>
              {columnTitle(c)}
            </option>
          ))}
      </select>
      <button
        type="button"
        className="btn btn-sm join-item"
        aria-label={labels.sortDirection}
        disabled={!current}
        onClick={() => table.setSorting([{ id: current.id, desc: !current.desc }])}
      >
        {current?.desc ? <ArrowDown size={14} /> : <ArrowUp size={14} />}
      </button>
    </div>
  );
}

/** "Columns" dropdown: show or hide columns, and pin them when pinning is on. */
function ColumnMenu<T>({ table, labels, pinnable }: { table: Table<T>; labels: Labels; pinnable: boolean }) {
  const pinButton = (
    column: Column<T, unknown>,
    side: 'left' | 'right' | false,
    label: string,
    text: React.ReactNode
  ) => (
    <button
      key={String(side)}
      type="button"
      className={cx('btn btn-ghost btn-xs', !side && 'btn-square')}
      aria-label={`${label} ${columnTitle(column)}`}
      onClick={() => column.pin(side)}
    >
      {text}
    </button>
  );
  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="btn btn-sm">
        <Columns3 size={16} /> {labels.columns}
      </div>
      <div
        tabIndex={0}
        className="dropdown-content z-20 mt-1 max-h-80 w-72 overflow-y-auto rounded-box border border-base-300 bg-base-100 p-2 shadow-lg"
      >
        {table
          .getAllLeafColumns()
          .filter((c) => c.id !== 'select')
          .map((column) => (
            <div
              key={column.id}
              className="flex items-center justify-between gap-2 rounded px-1 py-0.5 hover:bg-base-200"
            >
              <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="checkbox checkbox-xs"
                  checked={column.getIsVisible()}
                  disabled={!column.getCanHide()}
                  onChange={column.getToggleVisibilityHandler()}
                />
                <span className="truncate">{columnTitle(column)}</span>
              </label>
              {pinnable && column.getCanPin() ? (
                <div className="flex shrink-0 items-center">
                  {column.getIsPinned()
                    ? pinButton(column, false, labels.unpin, <PinOff size={14} />)
                    : [
                        pinButton(column, 'left', labels.pinLeft, 'L'),
                        pinButton(column, 'right', labels.pinRight, 'R'),
                      ]}
                </div>
              ) : null}
            </div>
          ))}
        <button
          type="button"
          className="btn btn-ghost btn-xs mt-1 w-full"
          onClick={() => {
            table.resetColumnVisibility();
            table.resetColumnPinning();
          }}
        >
          {labels.reset}
        </button>
      </div>
    </div>
  );
}

/** Page label, selected count and, when paging is on, the page size and page buttons. */
function Footer<T>({
  table,
  labels,
  pageSize,
  selectedCount,
}: {
  table: Table<T>;
  labels: Labels;
  /** Set when paging is on. */
  pageSize?: { current: number; options: number[] };
  /** Set when row selection is on. */
  selectedCount?: number;
}) {
  const first = !table.getCanPreviousPage();
  const last = !table.getCanNextPage();
  const buttons = [
    [labels.firstPage, ChevronsLeft, first, () => table.firstPage()],
    [labels.previousPage, ChevronLeft, first, () => table.previousPage()],
    [labels.nextPage, ChevronRight, last, () => table.nextPage()],
    [labels.lastPage, ChevronsRight, last, () => table.lastPage()],
  ] as const;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
      <div className="flex items-center gap-3">
        {pageSize ? (
          <span className="whitespace-nowrap">
            {labels.page(table.getState().pagination.pageIndex + 1, Math.max(table.getPageCount(), 1))}
          </span>
        ) : null}
        {selectedCount !== undefined ? (
          <span className="text-base-content/70">{labels.selected(selectedCount)}</span>
        ) : null}
      </div>
      {pageSize ? (
        <div className="flex items-center gap-3">
          <select
            aria-label={labels.rowsPerPage}
            className="select select-sm w-auto"
            value={pageSize.current}
            onChange={(e) => table.setPageSize(Number(e.target.value))}
          >
            {pageSize.options.map((n) => (
              <option key={n} value={n}>
                {labels.perPage(n)}
              </option>
            ))}
          </select>
          <div className="join">
            {buttons.map(([label, Icon, disabled, go]) => (
              <button key={label} className="btn btn-sm join-item" aria-label={label} disabled={disabled} onClick={go}>
                <Icon size={16} />
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/* ---------- Small pieces ---------- */

function SortIcon({ sorted }: { sorted: false | 'asc' | 'desc' }) {
  if (sorted === 'asc') return <ArrowUp size={14} />;
  if (sorted === 'desc') return <ArrowDown size={14} />;
  return <ArrowUpDown size={14} className="opacity-40" />;
}

type CheckboxProps = {
  checked: boolean;
  indeterminate?: boolean;
  disabled?: boolean;
  onChange: (e: unknown) => void;
  label: string;
};

function Checkbox({ checked, indeterminate = false, disabled, onChange, label }: CheckboxProps) {
  return (
    <input
      type="checkbox"
      aria-label={label}
      className="checkbox checkbox-sm"
      checked={checked}
      disabled={disabled}
      ref={(el) => {
        if (el) el.indeterminate = indeterminate && !checked;
      }}
      onClick={(e) => e.stopPropagation()}
      onChange={onChange}
    />
  );
}

const RowCheckbox = <T,>({ row, label }: { row: Row<T>; label: string }) => (
  <Checkbox
    checked={row.getIsSelected()}
    disabled={!row.getCanSelect()}
    onChange={row.getToggleSelectedHandler()}
    label={label}
  />
);
