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
  type Cell,
  type CellContext,
  type ColumnFiltersState,
  type ColumnPinningState,
  type Header,
  type HeaderContext,
  type HeaderGroup,
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
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type FormEvent,
  type RefObject,
} from 'react';
import { readSearchText, TypeSearch } from './type.search.tsx';

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
 * - `grid-column`: cards side by side in one strip, scrolls horizontally.
 * - `grid-row`: cards of equal size in a grid, scrolls vertically.
 * - `masonry-row`: cards in lanes, each as tall as its content, scrolls vertically.
 * - `masonry-column`: cards in lanes, widths from `estimateSize`, scrolls horizontally.
 */
export type TypeDataViewLayout =
  | 'rows'
  | 'list'
  | 'grid-column'
  | 'grid-row'
  | 'masonry-row'
  | 'masonry-column';

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
   * Records are displayed as a table ("rows"), list ("list"), or one of the card layouts.
   * Leave it out for automatic: rows on desktop and masonry-row cards below 768px.
   * Only "rows" has column headers, sorting arrows and checkboxes.
   */
  layout?: TypeDataViewLayout;
  /**
   * Number of lanes (grid/masonry columns, or rows for "masonry-column").
   * For "grid-row" and "masonry-row" it is the most lanes: fewer are used when the scroll area is too narrow
   * for `minCardWidth`. Default: as many as fit.
   */
  lanes?: number;
  /** Narrowest card in px for "grid-row" and "masonry-row"; sets how many lanes fit the width. Default 260. */
  minCardWidth?: number;
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
   * card height for "grid-row" and "masonry-row", card width for "grid-column" and "masonry-column".
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
const CARD_MIN_HEIGHT = 360;
const CARD_MIN_WIDTH = 260;
const MOBILE_QUERY = '(max-width: 767px)';
const DEFAULT_SIZE: Record<TypeDataViewLayout, number> = {
  rows: 48,
  list: 72,
  'grid-column': 280,
  'grid-row': 300,
  'masonry-row': 300,
  'masonry-column': 280,
};

type Labels = TypeDataViewLabels;

/** Joins the class names that are set. */
function cx(...parts: (string | false | null | undefined)[]): string {
  const definedParts = parts.filter(Boolean);
  return definedParts.join(' ');
}

function columnTitle<T>(column: Column<T, unknown>): string {
  return typeof column.columnDef.header === 'string' && column.columnDef.header ? column.columnDef.header : column.id;
}

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

/** Resolves the automatic layout from the screen size. */
function resolveLayout(layout: TypeDataViewProps<unknown>['layout'], isMobile: boolean): TypeDataViewLayout {
  return layout ?? (isMobile ? 'masonry-row' : 'rows');
}

function subscribeToMediaQuery(notify: () => void): () => void {
  const mq = window.matchMedia(MOBILE_QUERY);
  mq.addEventListener('change', notify);
  return mq.removeEventListener.bind(mq, 'change', notify);
}

function getMediaQuerySnapshot(): boolean {
  return window.matchMedia(MOBILE_QUERY).matches;
}

function getMediaQueryServerSnapshot(): boolean {
  return false;
}

function useIsMobile(): boolean {
  return useSyncExternalStore(subscribeToMediaQuery, getMediaQuerySnapshot, getMediaQueryServerSnapshot);
}

/** State that follows `value` when the parent passes it, and is kept here otherwise. */
function useControlled<V>(value: V | undefined, initial: V) {
  const [inner, setInner] = useState(initial);
  return [value ?? inner, setInner] as const;
}

type Size = { width: number; height: number };

function updateSizeFromRect(rect: DOMRectReadOnly, setSize: React.Dispatch<React.SetStateAction<Size>>) {
  setSize({ width: rect.width, height: rect.height });
}

function handleResizeObserverEntries(setSize: React.Dispatch<React.SetStateAction<Size>>, entries: ResizeObserverEntry[]) {
  const entry = entries[0];
  if (entry) updateSizeFromRect(entry.contentRect, setSize);
}

function disconnectObserver(observer: ResizeObserver): void {
  observer.disconnect();
}

function initializeSizeObserver(
  ref: RefObject<HTMLElement | null>,
  setSize: React.Dispatch<React.SetStateAction<Size>>
): (() => void) | undefined {
  const el = ref.current;
  if (!el) return undefined;
  setSize({ width: el.clientWidth, height: el.clientHeight });
  const handleEntries = handleResizeObserverEntries.bind(null, setSize);
  const observer = new ResizeObserver(handleEntries);
  observer.observe(el);
  return disconnectObserver.bind(null, observer);
}

/** Width and height of an element, kept up to date while it resizes. */
function useSize(ref: RefObject<HTMLElement | null>) {
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  const initializeObserver = initializeSizeObserver.bind(null, ref, setSize);
  useLayoutEffect(initializeObserver, [ref, setSize]);
  return size;
}

function handleEndReachedEffect(reached: boolean, count: number, firedFor: React.MutableRefObject<number>, onEndReached?: () => void) {
  if (reached && firedFor.current !== count) {
    firedFor.current = count;
    onEndReached?.();
  }
}

/** Calls `onEndReached` once per distinct row count while the end of the list is visible. */
function useEndReached(reached: boolean, count: number, onEndReached?: () => void) {
  const firedFor = useRef(-1);
  const handleEffect = handleEndReachedEffect.bind(null, reached, count, firedFor, onEndReached);
  useEffect(handleEffect, [reached, count, onEndReached]);
}

function renderSelectHeader<T>(table: Table<T>, multiple: boolean, labels: Labels): React.ReactNode {
  return multiple ? (
    <Checkbox
      checked={table.getIsAllPageRowsSelected()}
      indeterminate={table.getIsSomePageRowsSelected()}
      onChange={table.getToggleAllPageRowsSelectedHandler()}
      label={labels.selectAll}
    />
  ) : null;
}

function renderSelectCell<T>(row: Row<T>, labels: Labels): React.ReactNode {
  return <RowCheckbox row={row} label={labels.selectRow} />;
}

function renderSelectHeaderContext<T>(multiple: boolean, labels: Labels, context: HeaderContext<T, unknown>): React.ReactNode {
  return renderSelectHeader(context.table, multiple, labels);
}

function renderSelectCellContext<T>(labels: Labels, context: CellContext<T, unknown>): React.ReactNode {
  return renderSelectCell(context.row, labels);
}

/** The leading checkbox column of the table. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function selectColumn<T>(multiple: boolean, labels: Labels): ColumnDef<T, any> {
  const header = (renderSelectHeaderContext<T>).bind(null, multiple, labels);
  const cell = (renderSelectCellContext<T>).bind(null, labels);
  return {
    id: 'select',
    size: 44,
    enableSorting: false,
    enableHiding: false,
    enableColumnFilter: false,
    enableGlobalFilter: false,
    meta: { className: 'w-11' },
    header,
    cell,
  };
}

function buildLabels(labels: Partial<Labels> | undefined): Labels {
  return { ...TYPE_DATA_VIEW_LABELS, ...labels };
}

function syncGlobalFilter(setGlobalFilterInput: React.Dispatch<React.SetStateAction<string>>, globalFilter: string): void {
  setGlobalFilterInput(globalFilter);
}

function buildColumns<T>(
  selectable: boolean,
  isRows: boolean,
  enableMultiRowSelection: boolean,
  labels: Labels,
  columns: ColumnDef<T, any>[] // eslint-disable-line @typescript-eslint/no-explicit-any
): ColumnDef<T, any>[] { // eslint-disable-line @typescript-eslint/no-explicit-any
  if (!selectable || !isRows) return columns;
  const selectionColumn = selectColumn<T>(enableMultiRowSelection, labels);
  return [selectionColumn, ...columns];
}

function extractOriginal<T>(row: Row<T>): T {
  return row.original;
}

function reportSelectedRows<T>(onSelectedRowsChange: ((rows: T[]) => void) | undefined, selectedRows: Row<T>[]): void {
  const originals = selectedRows.map(extractOriginal);
  onSelectedRowsChange?.(originals);
}

function resolveSize(
  estimateSize: number | ((index: number) => number) | undefined,
  view: TypeDataViewLayout,
  index: number
): number {
  return typeof estimateSize === 'function' ? estimateSize(index) : (estimateSize ?? DEFAULT_SIZE[view]);
}

function getScrollElement(ref: RefObject<HTMLDivElement | null>): HTMLDivElement | null {
  return ref.current;
}

function resetScroll(ref: RefObject<HTMLDivElement | null>): void {
  ref.current?.scrollTo({ top: 0, left: 0 });
}

function canSortColumn<T>(column: Column<T, unknown>): boolean {
  return column.getCanSort();
}

function handleGlobalSearch<T>(table: Table<T>, event: FormEvent<HTMLFormElement>): void {
  const searchText = readSearchText(event);
  table.setGlobalFilter(searchText);
}

function handleGlobalFilterInput(
  setGlobalFilterInput: React.Dispatch<React.SetStateAction<string>>,
  event: React.ChangeEvent<HTMLInputElement>
): void {
  setGlobalFilterInput(event.currentTarget.value);
}

function selectedRowCount(rowSelection: RowSelectionState): number {
  const values = Object.values(rowSelection);
  const selected = values.filter(Boolean);
  return selected.length;
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
  layout,
  lanes: lanesProp,
  minCardWidth = CARD_MIN_WIDTH,
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
  const buildViewLabels = buildLabels.bind(null, labelsProp);
  const labels = useMemo(buildViewLabels, [labelsProp]);
  const isMobile = useIsMobile();
  const view = resolveLayout(layout, isMobile);
  const isRows = view === 'rows';
  const horizontal = view === 'grid-column' || view === 'masonry-column';
  // Rows, list items and masonry-row cards are measured; the other views use the sizes given.
  const measured = isRows || view === 'list' || view === 'masonry-row';
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
  const [globalFilterInput, setGlobalFilterInput] = useState(globalFilter);
  const globalSearchName = `data-view-search-${useId()}`;
  const syncFilterInput = syncGlobalFilter.bind(null, setGlobalFilterInput, globalFilter);
  useEffect(syncFilterInput, [globalFilter]);
  const [columnFilters, setColumnFilters] = useControlled(columnFiltersProp, initialState?.columnFilters ?? []);
  const [columnVisibility, setColumnVisibility] = useControlled(
    columnVisibilityProp,
    initialState?.columnVisibility ?? {}
  );
  const [columnPinning, setColumnPinning] = useControlled(columnPinningProp, initialState?.columnPinning ?? {});

  const buildAllColumns = (buildColumns<T>).bind(null, selectable, isRows, enableMultiRowSelection, labels, columns);
  const allColumns = useMemo(buildAllColumns, [columns, selectable, isRows, enableMultiRowSelection, labels]);

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
  const reportRows = (reportSelectedRows<T>).bind(null, onSelectedRowsChange, selectedRows);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(reportRows, [rowSelection]);

  // Virtualization. Lanes follow the size of the scroll area unless `lanes` is given.
  const scrollRef = useRef<HTMLDivElement>(null);
  const box = useSize(scrollRef);
  // Vertical card lanes fit the width of the scroll area (not the window, so a sidebar or a narrow parent counts):
  // each lane is at least `minCardWidth` wide, and `lanes` is the most. Before the first measure, `lanes` is used.
  const fitLanes = box.width > 0 ? box.width / minCardWidth : (lanesProp ?? 1);
  const autoLanes =
    view === 'masonry-column'
      ? (lanesProp ?? box.height / CARD_MIN_HEIGHT)
      : view === 'grid-row' || view === 'masonry-row'
        ? Math.min(lanesProp ?? Infinity, fitLanes)
        : 1;
  const flooredAutoLanes = Math.floor(autoLanes);
  const lanes = isRows || view === 'list' || view === 'grid-column' ? 1 : Math.max(1, flooredAutoLanes);
  const resolveItemSize = resolveSize.bind(null, estimateSize, view);
  const sizeOf = useCallback(resolveItemSize, [estimateSize, view]);
  const readScrollElement = getScrollElement.bind(null, scrollRef);
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: readScrollElement,
    horizontal,
    lanes,
    estimateSize: sizeOf,
    overscan,
  });
  const items = virtualizer.getVirtualItems();
  const lastIndex = items.length ? items[items.length - 1].index : -1;
  const endReached = !!onEndReached && !loading && rows.length > 0 && lastIndex >= rows.length - endReachedThreshold;
  const visibleRowCount = rows.length;
  useEndReached(endReached, visibleRowCount, onEndReached);

  // Back to the top whenever the page, sort order or filters change.
  const resetKey = JSON.stringify([sorting, globalFilter, columnFilters]);
  const resetViewScroll = resetScroll.bind(null, scrollRef);
  useEffect(resetViewScroll, [pageState.pageIndex, resetKey, view]);

  const fill = height === 'fill';
  const autoHeight = height === 'auto';
  const totalSize = virtualizer.getTotalSize();
  const leafColumns = table.getAllLeafColumns();
  const cardSortable = !isRows && leafColumns.some(canSortColumn);
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
    total: totalSize,
    measure: virtualizer.measureElement,
    skeletonCount: skeletonCount ?? (isRows || view === 'list' ? SKELETON_ROWS : horizontal ? lanes * 4 : lanes * 2),
    resizable: enableColumnResizing,
    filterable: enableColumnFilters,
    onRowClick,
    getRowClassName,
    renderCard,
    renderListItem,
  };
  const submitGlobalSearch = (handleGlobalSearch<T>).bind(null, table);
  const updateGlobalFilterInput = handleGlobalFilterInput.bind(null, setGlobalFilterInput);

  return (
    <div className={cx('flex flex-col gap-2', fill && 'min-h-0 flex-1', className)}>
      {enableGlobalFilter || showColumnsMenu || cardSortable || renderToolbar ? (
        <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-2 bg-transparent py-2 backdrop-blur-sm">
          {enableGlobalFilter ? (
            <TypeSearch
              name={globalSearchName}
              label={labels.search}
              value={globalFilterInput}
              className="w-full max-w-md flex-1"
              onChange={updateGlobalFilterInput}
              onSearch={submitGlobalSearch}
            />
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
          selectedCount={selectable ? selectedRowCount(rowSelection) : undefined}
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

function triggerRowClick<T>(row: Row<T>, onRowClick: (row: T) => void): void {
  onRowClick(row.original);
}

function handleRowKeyDown<T>(row: Row<T>, onRowClick: (row: T) => void, event: React.KeyboardEvent): void {
  if (event.target !== event.currentTarget || (event.key !== 'Enter' && event.key !== ' ')) return;
  event.preventDefault();
  onRowClick(row.original);
}

function onClickOf<T>(row: Row<T>, onRowClick?: (row: T) => void) {
  if (!onRowClick) return undefined;
  return {
    tabIndex: 0,
    onClick: (triggerRowClick<T>).bind(null, row, onRowClick),
    onKeyDown: (handleRowKeyDown<T>).bind(null, row, onRowClick),
  };
}

function renderTableSpacer<T>(height: number, visible: Column<T, unknown>[]): React.ReactNode {
  return (
    <tr aria-hidden style={{ height }}>
      <td colSpan={visible.length} className="p-0" />
    </tr>
  );
}

function stopPropagation(event: React.MouseEvent): void {
  event.stopPropagation();
}

function resetColumnSize<T>(column: Column<T, unknown>): void {
  column.resetSize();
}

function setColumnFilter<T>(column: Column<T, unknown>, event: React.ChangeEvent<HTMLInputElement>): void {
  column.setFilterValue(event.target.value || undefined);
}

function renderFilterCell<T>(labels: Labels, column: Column<T, unknown>): React.ReactNode {
  const pinned = column.getIsPinned();
  const style = pinned ? { width: column.getSize() } : {};
  const filterChange = (setColumnFilter<T>).bind(null, column);
  return (
    <th key={column.id} className={cx('py-1 font-normal', pinned && 'bg-base-100')} style={{ ...style, ...pinStyle(column) }}>
      {column.getCanFilter() ? (
        <input
          className="input input-xs w-full"
          placeholder={labels.filter}
          aria-label={`${labels.filter} ${column.id}`}
          value={(column.getFilterValue() as string) ?? ''}
          onChange={filterChange}
        />
      ) : null}
    </th>
  );
}

function renderSkeletonCell<T>(column: Column<T, unknown>): React.ReactNode {
  return <td key={column.id}><div className="skeleton h-4 w-full max-w-40" /></td>;
}

function renderSkeletonRow<T>(visible: Column<T, unknown>[], index: number): React.ReactNode {
  const cells = visible.map(renderSkeletonCell);
  return <tr key={`sk-${index}`} aria-hidden>{cells}</tr>;
}

function renderSkeletonRows<T>(visible: Column<T, unknown>[], _: unknown, index: number): React.ReactNode {
  return renderSkeletonRow(visible, index);
}

function renderTableCell<T>(cell: Cell<T, unknown>): React.ReactNode {
  const pinned = cell.column.getIsPinned();
  const columnSize = cell.column.getSize();
  const style = pinned ? { width: columnSize, ...pinStyle(cell.column) } : undefined;
  const value = cell.getValue();
  const title = String(value ?? '');
  const context = cell.getContext();
  const content = flexRender(cell.column.columnDef.cell, context);
  return <td key={cell.id} className={cx('max-w-64 truncate whitespace-nowrap', pinned && 'bg-base-100', cell.column.columnDef.meta?.className)} title={title} style={style}>{content}</td>;
}

function renderTableRow<T>(
  rows: Row<T>[],
  measure: (node: Element | null) => void,
  onRowClick: ((row: T) => void) | undefined,
  getRowClassName: ((row: T) => string) | undefined,
  item: VirtualItem
): React.ReactNode {
  const row = rows[item.index];
  const cells = row.getVisibleCells();
  const renderedCells = cells.map(renderTableCell);
  const clickHandler = onRowClick ? (triggerRowClick<T>).bind(null, row, onRowClick) : undefined;
  const keyHandler = onRowClick ? (handleRowKeyDown<T>).bind(null, row, onRowClick) : undefined;
  const selected = row.getIsSelected();
  const rowClassName = getRowClassName?.(row.original);
  const className = cx('hover:bg-base-200', selected && 'bg-primary/10', onRowClick && CLICKABLE, rowClassName);
  return <tr key={row.id} data-index={item.index} ref={measure} className={className} tabIndex={onRowClick ? 0 : undefined} onClick={clickHandler} onKeyDown={keyHandler}>{renderedCells}</tr>;
}

function renderHeaderCell<T>(resizable: boolean, header: Header<T, unknown>): React.ReactNode {
  const column = header.column;
  const canSort = column.getCanSort();
  const sorted = column.getIsSorted();
  const pinned = column.getIsPinned();
  const fixedWidth = resizable || pinned || column.columnDef.size !== undefined;
  const width = fixedWidth ? { width: header.getSize() } : {};
  const resetSize = (resetColumnSize<T>).bind(null, column);
  const stickyStyle = pinStyle(column);
  const style = { ...width, ...stickyStyle };
  const className = cx('relative', pinned && 'bg-base-100', column.columnDef.meta?.className, canSort && 'cursor-pointer select-none');
  const headerContext = header.getContext();
  const headerContent = flexRender(column.columnDef.header, headerContext);
  const resizeClassName = cx('absolute right-0 top-0 h-full w-1.5 cursor-col-resize touch-none select-none hover:bg-primary/60', column.getIsResizing() && 'bg-primary');
  const resizeHandle = resizable && column.getCanResize() ? <div role="separator" aria-orientation="vertical" onClick={stopPropagation} onDoubleClick={resetSize} onMouseDown={header.getResizeHandler()} onTouchStart={header.getResizeHandler()} className={resizeClassName} /> : null;
  const content = header.isPlaceholder ? null : <span className="inline-flex items-center gap-1">{headerContent}{canSort ? <SortIcon sorted={sorted} /> : null}</span>;
  return <th key={header.id} colSpan={header.colSpan} style={style} className={className} aria-sort={sorted === 'asc' ? 'ascending' : sorted === 'desc' ? 'descending' : undefined} onClick={column.getToggleSortingHandler()}>{content}{resizeHandle}</th>;
}

function renderHeaderGroup<T>(resizable: boolean, group: HeaderGroup<T>): React.ReactNode {
  const renderHeader = (renderHeaderCell<T>).bind(null, resizable);
  const cells = group.headers.map(renderHeader);
  return <tr key={group.id}>{cells}</tr>;
}

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
  const headerGroups = table.getHeaderGroups();
  const renderHeader = (renderHeaderGroup<T>).bind(null, resizable);
  const renderedHeaders = headerGroups.map(renderHeader);
  const renderFilter = (renderFilterCell<T>).bind(null, labels);
  const renderedFilters = visible.map(renderFilter);
  const renderSkeleton = (renderSkeletonRows<T>).bind(null, visible);
  const skeletonRows = Array.from({ length: skeletonCount }, renderSkeleton);
  const renderRow = (renderTableRow<T>).bind(null, rows, measure, onRowClick, getRowClassName);
  const renderedRows = items.map(renderRow);
  const paddingTopRow = paddingTop > 0 ? renderTableSpacer(paddingTop, visible) : null;
  const paddingBottomRow = paddingBottom > 0 ? renderTableSpacer(paddingBottom, visible) : null;
  const tableSize = resizable ? table.getTotalSize() : undefined;

  return (
    <table className={cx('table', stickyHeader && 'table-pin-rows', tableClassName)} style={resizable ? { width: tableSize, minWidth: '100%', tableLayout: 'fixed' } : undefined}>
      <thead>
        {renderedHeaders}
        {filterable ? <tr>{renderedFilters}</tr> : null}
      </thead>
      <tbody>{loading ? skeletonRows : <>{paddingTopRow}{renderedRows}{paddingBottomRow}</>}</tbody>
    </table>
  );
}

function renderListCell<T>(cell: Cell<T, unknown>, index: number): React.ReactNode {
  const context = cell.getContext();
  const content = flexRender(cell.column.columnDef.cell, context);
  return <div key={cell.id} className={cx('min-w-0 text-sm', index === 0 && 'list-col-grow')}>{content}</div>;
}

function renderListRow<T>(props: ViewProps<T>, item: VirtualItem): React.ReactNode {
  const { labels, rows, measure, selectable, onRowClick, getRowClassName, renderListItem } = props;
  const row = rows[item.index];
  const visibleCells = row.getVisibleCells();
  const cells = visibleCells.map(renderListCell);
  const clickProps = onClickOf(row, onRowClick);
  const selectionCheckbox = selectable ? <RowCheckbox row={row} label={labels.selectRow} /> : null;
  const content = renderListItem ? renderListItem(row.original, row) : <>{selectionCheckbox}{cells}</>;
  const isSelected = row.getIsSelected();
  const rowStateClass = isSelected ? 'bg-primary/10' : 'hover:bg-base-200';
  const rowClassName = getRowClassName?.(row.original);
  const className = cx('list-row absolute left-0 top-0 w-full', rowStateClass, onRowClick && CLICKABLE, rowClassName);
  return <li key={row.id} data-index={item.index} ref={measure} className={className} style={{ transform: `translateY(${item.start}px)` }} {...clickProps}>{content}</li>;
}

function ListView<T>(props: ViewProps<T>) {
  const renderRow = (renderListRow<T>).bind(null, props);
  const rows = props.items.map(renderRow);
  return <ul className="list relative" style={{ height: props.total }}>{rows}</ul>;
}

function renderCardCell<T>(cell: Cell<T, unknown>): React.ReactNode {
  const header = cell.column.columnDef.header;
  const value = cell.getValue();
  const title = String(value ?? '');
  const context = cell.getContext();
  const content = flexRender(cell.column.columnDef.cell, context);
  return <div key={cell.id} className="min-w-0 truncate text-xs @xs:text-sm" title={title}>{typeof header === 'string' && header ? <div className="text-[10px] @xs:text-xs uppercase text-base-content/60">{header}</div> : null}{content}</div>;
}

function renderCardRow<T>(props: ViewProps<T>, item: VirtualItem): React.ReactNode {
  const { labels, rows, measure, horizontal, measured, lanes, sizeOf, selectable, onRowClick, getRowClassName, renderCard } = props;
  const row = rows[item.index];
  const lane = `${(item.lane * 100) / lanes}%`;
  const laneSize = `${100 / lanes}%`;
  const size = sizeOf(item.index);
  const style = horizontal ? { top: lane, height: laneSize, width: size, transform: `translateX(${item.start}px)` } : { left: lane, width: laneSize, height: measured ? undefined : size, transform: `translateY(${item.start}px)` };
  const visibleCells = row.getVisibleCells();
  const cells = visibleCells.map(renderCardCell);
  const clickProps = onClickOf(row, onRowClick);
  const selected = row.getIsSelected();
  const cardClassName = cx('card card-border @container relative bg-base-100 w-full h-full', !measured && 'overflow-auto', selected ? 'border-primary bg-primary/10' : 'border-base-300');
  const rowClassName = getRowClassName?.(row.original);
  const contentClassName = cx(!measured && 'h-full', onRowClick && CLICKABLE, rowClassName);
  const checkbox = selectable ? <div className="absolute right-3 top-3"><RowCheckbox row={row} label={labels.selectRow} /></div> : null;
  const defaultCard = <div className={cardClassName}><div className="card-body grid grid-cols-1 gap-x-3 gap-y-2 p-3 @xs:gap-x-4 @xs:gap-y-3 @xs:p-4 @md:grid-cols-2">{checkbox}{cells}</div></div>;
  const content = renderCard ? renderCard(row.original, row) : defaultCard;
  return <div key={row.id} data-index={item.index} ref={measured ? measure : undefined} className="absolute left-0 top-0 p-1 sm:p-2" style={style}><div className={contentClassName} {...clickProps}>{content}</div></div>;
}

function CardsView<T>(props: ViewProps<T>) {
  const renderRow = (renderCardRow<T>).bind(null, props);
  const rows = props.items.map(renderRow);
  const style = props.horizontal ? { width: props.total, height: '100%' } : { height: props.total, width: '100%' };
  return <div className="relative" style={style}>{rows}</div>;
}

/** Placeholders shown instead of the list or cards while loading. */
function renderSkeletonCard(_: unknown, index: number): React.ReactNode {
  return <div key={index} className="skeleton h-full w-full rounded-box" />;
}

function SkeletonCards<T>({ horizontal, lanes, sizeOf, skeletonCount }: ViewProps<T>) {
  const size = sizeOf(0);
  const cards = Array.from({ length: skeletonCount }, renderSkeletonCard);
  const style = horizontal ? { height: '100%', gridAutoFlow: 'column' as const, gridTemplateRows: `repeat(${lanes}, 1fr)`, gridAutoColumns: size } : { gridTemplateColumns: `repeat(${lanes}, 1fr)`, gridAutoRows: size };
  return <div aria-hidden className="grid gap-4 p-2" style={style}>{cards}</div>;
}

/* ---------- Toolbar and footer ---------- */

function renderSortOption<T>(column: Column<T, unknown>): React.ReactNode {
  return <option key={column.id} value={column.id}>{columnTitle(column)}</option>;
}

function setCardSorting<T>(table: Table<T>, current: SortingState[number] | undefined, event: React.ChangeEvent<HTMLSelectElement>): void {
  table.setSorting(event.target.value ? [{ id: event.target.value, desc: !!current?.desc }] : []);
}

function toggleCardSorting<T>(table: Table<T>, current: SortingState[number]): void {
  table.setSorting([{ id: current.id, desc: !current.desc }]);
}

/** Cards have no header row, so sorting is picked from a menu. */
function CardSortBar<T>({ table, labels }: { table: Table<T>; labels: Labels }) {
  const current = table.getState().sorting[0];
  const allColumns = table.getAllLeafColumns();
  const sortableColumns = allColumns.filter(canSortColumn);
  const options = sortableColumns.map(renderSortOption);
  const changeSorting = (setCardSorting<T>).bind(null, table, current);
  const toggleSorting = current ? (toggleCardSorting<T>).bind(null, table, current) : undefined;
  return <div className="join"><select aria-label={labels.sortBy} className="select select-sm join-item w-auto" value={current?.id ?? ''} onChange={changeSorting}><option value="">{labels.sortBy}</option>{options}</select><button type="button" className="btn btn-sm join-item" aria-label={labels.sortDirection} disabled={!current} onClick={toggleSorting}>{current?.desc ? <ArrowDown size={14} /> : <ArrowUp size={14} />}</button></div>;
}

/** "Columns" dropdown: show or hide columns, and pin them when pinning is on. */
function pinColumn<T>(column: Column<T, unknown>, side: 'left' | 'right' | false): void {
  column.pin(side);
}

function renderPinButton<T>(column: Column<T, unknown>, side: 'left' | 'right' | false, label: string, text: React.ReactNode): React.ReactNode {
  const pin = (pinColumn<T>).bind(null, column, side);
  return <button key={String(side)} type="button" className={cx('btn btn-ghost btn-xs', !side && 'btn-square')} aria-label={`${label} ${columnTitle(column)}`} onClick={pin}>{text}</button>;
}

function renderColumnMenuItem<T>(labels: Labels, pinnable: boolean, column: Column<T, unknown>): React.ReactNode {
  const title = columnTitle(column);
  const pinControls = column.getIsPinned() ? renderPinButton(column, false, labels.unpin, <PinOff size={14} />) : [renderPinButton(column, 'left', labels.pinLeft, 'L'), renderPinButton(column, 'right', labels.pinRight, 'R')];
  return <div key={column.id} className="flex items-center justify-between gap-2 rounded px-1 py-0.5 hover:bg-base-200"><label className="flex min-w-0 flex-1 cursor-pointer items-center gap-2 text-sm"><input type="checkbox" className="checkbox checkbox-xs" checked={column.getIsVisible()} disabled={!column.getCanHide()} onChange={column.getToggleVisibilityHandler()} /><span className="truncate">{title}</span></label>{pinnable && column.getCanPin() ? <div className="flex shrink-0 items-center">{pinControls}</div> : null}</div>;
}

function resetColumns<T>(table: Table<T>): void {
  table.resetColumnVisibility();
  table.resetColumnPinning();
}

function isDataColumn<T>(column: Column<T, unknown>): boolean {
  return column.id !== 'select';
}

/** "Columns" dropdown: show or hide columns, and pin them when pinning is on. */
function ColumnMenu<T>({ table, labels, pinnable }: { table: Table<T>; labels: Labels; pinnable: boolean }) {
  const allColumns = table.getAllLeafColumns();
  const dataColumns = allColumns.filter(isDataColumn);
  const renderItem = (renderColumnMenuItem<T>).bind(null, labels, pinnable);
  const items = dataColumns.map(renderItem);
  const reset = (resetColumns<T>).bind(null, table);
  const columnsIcon = <Columns3 size={16} />;
  return <div className="dropdown dropdown-end"><div tabIndex={0} role="button" className="btn btn-sm btn-square" aria-label={labels.columns} title={labels.columns}>{columnsIcon}</div><div tabIndex={0} className="dropdown-content z-20 mt-1 max-h-80 w-72 overflow-y-auto rounded-box border border-base-300 bg-base-100 p-2 shadow-lg">{items}<button type="button" className="btn btn-ghost btn-xs mt-1 w-full" onClick={reset}>{labels.reset}</button></div></div>;
}

/** Page label, selected count and, when paging is on, the page size and page buttons. */
function setPageSize<T>(table: Table<T>, event: React.ChangeEvent<HTMLSelectElement>): void {
  const pageSize = Number(event.target.value);
  table.setPageSize(pageSize);
}

function renderPageSizeOption(labels: Labels, size: number): React.ReactNode {
  const label = labels.perPage(size);
  return <option key={size} value={size}>{label}</option>;
}

function renderPageButton(entry: readonly [string, React.ComponentType<{ size?: number }>, boolean, () => void]): React.ReactNode {
  const [label, Icon, disabled, go] = entry;
  return <button key={label} className="btn btn-sm join-item" aria-label={label} disabled={disabled} onClick={go}><Icon size={16} /></button>;
}

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
  const firstPage = table.firstPage.bind(table);
  const previousPage = table.previousPage.bind(table);
  const nextPage = table.nextPage.bind(table);
  const lastPage = table.lastPage.bind(table);
  const buttons = [
    [labels.firstPage, ChevronsLeft, first, firstPage],
    [labels.previousPage, ChevronLeft, first, previousPage],
    [labels.nextPage, ChevronRight, last, nextPage],
    [labels.lastPage, ChevronsRight, last, lastPage],
  ] as const;
  const state = table.getState();
  const pagination = state.pagination;
  const pageIndex = pagination.pageIndex;
  const pageCount = table.getPageCount();
  const totalPages = Math.max(pageCount, 1);
  const pageLabel = labels.page(pageIndex + 1, totalPages);
  const updatePageSize = (setPageSize<T>).bind(null, table);
  const renderSizeOption = renderPageSizeOption.bind(null, labels);
  const pageOptions = pageSize ? pageSize.options.map(renderSizeOption) : [];
  const pageButtons = buttons.map(renderPageButton);
  return <div className="flex flex-wrap items-center justify-between gap-2 text-sm"><div className="flex items-center gap-3">{pageSize ? <span className="whitespace-nowrap">{pageLabel}</span> : null}{selectedCount !== undefined ? <span className="text-base-content/70">{labels.selected(selectedCount)}</span> : null}</div>{pageSize ? <div className="flex items-center gap-3"><select aria-label={labels.rowsPerPage} className="select select-sm w-auto" value={pageSize.current} onChange={updatePageSize}>{pageOptions}</select><div className="join">{pageButtons}</div></div> : null}</div>;
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

function setCheckboxIndeterminate(indeterminate: boolean, checked: boolean, element: HTMLInputElement | null): void {
  if (element) element.indeterminate = indeterminate && !checked;
}

function stopCheckboxPropagation(event: React.MouseEvent): void {
  event.stopPropagation();
}

function Checkbox({ checked, indeterminate = false, disabled, onChange, label }: CheckboxProps) {
  const setIndeterminate = setCheckboxIndeterminate.bind(null, indeterminate, checked);
  return <input type="checkbox" aria-label={label} className="checkbox checkbox-sm" checked={checked} disabled={disabled} ref={setIndeterminate} onClick={stopCheckboxPropagation} onChange={onChange} />;
}

function RowCheckbox<T>({ row, label }: { row: Row<T>; label: string }) {
  return <Checkbox checked={row.getIsSelected()} disabled={!row.getCanSelect()} onChange={row.getToggleSelectedHandler()} label={label} />;
}
