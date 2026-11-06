// type.table.tsx
// Simple DaisyUI table for lists.
//
//   const userColumns: TableColumn<UserType>[] = [
//     { key: "name", headerKey: "user.name" },
//     { key: "email", headerKey: "user.email" },
//   ];
//   <TypeTable rows={users} columns={userColumns} rowKey="id" onRowClick={handleUserRowClick} />
//
//   function handleUserRowClick(event: MouseEvent<HTMLTableRowElement>) {
//     const userId = readRowKey(event);
//     editModeUpdate(userId);
//   }

import type { MouseEvent, MouseEventHandler, ReactElement, ReactNode } from "react";
import { ConstValue } from "dff-util";
import { useUi } from "../context/use-ui.ts";
import type { TranslateFunction } from "../interfaces/ui-context.ts";
import { EmptyState } from "../components/empty-state.tsx";
import { SkeletonTable } from "../skeleton/skeleton-table.tsx";
import { joinClassNames } from "./class-names.ts";

export interface TableColumn<RowType> {
  /** Field of the row shown in the column. */
  key: keyof RowType & string;
  /** Translation key of the heading. */
  headerKey: string;
  /** Optional top-level function that returns custom cell content. */
  render?: (row: RowType) => ReactNode;
  className?: string;
}

export interface TypeTableProps<RowType> {
  rows: RowType[];
  columns: TableColumn<RowType>[];
  /** Field that is unique per row. Its value is put in data-row-key. */
  rowKey: keyof RowType & string;
  isLoading?: boolean;
  /** Text when there are no rows (translation key). Default "ui.noData". */
  emptyKey?: string;
  /** Row click handler. Read the clicked row id with readRowKey(event). */
  onRowClick?: MouseEventHandler<HTMLTableRowElement>;
  className?: string;
}

/** Returns the row key of the clicked row (from data-row-key). */
export function readRowKey(event: MouseEvent<HTMLElement>): string {
  const element = event.currentTarget;
  const rowKey = element.dataset.rowKey;
  return rowKey ?? ConstValue.EMPTY;
}

/** Returns the content of one cell. */
export function readCellContent<RowType>(row: RowType, column: TableColumn<RowType>): ReactNode {
  if (column.render) {
    const customContent = column.render(row);
    return customContent;
  }
  const cellValue = row[column.key];
  if (cellValue === null || cellValue === undefined) {
    return ConstValue.EMPTY;
  }
  const cellText = String(cellValue);
  return cellText;
}

/** Builds the heading cells. */
function buildHeaderCells<RowType>(columns: TableColumn<RowType>[], t: TranslateFunction): ReactElement[] {
  const headerCells: ReactElement[] = [];
  for (const column of columns) {
    const headerText = t(column.headerKey);
    const headerCell = (
      <th key={column.key} className={column.className}>
        {headerText}
      </th>
    );
    headerCells.push(headerCell);
  }
  return headerCells;
}

/** Builds the cells of one row. */
function buildRowCells<RowType>(row: RowType, columns: TableColumn<RowType>[]): ReactElement[] {
  const cells: ReactElement[] = [];
  for (const column of columns) {
    const cellContent = readCellContent(row, column);
    const cell = (
      <td key={column.key} className={column.className}>
        {cellContent}
      </td>
    );
    cells.push(cell);
  }
  return cells;
}

/** Builds all body rows. */
function buildBodyRows<RowType>(
  rows: RowType[],
  columns: TableColumn<RowType>[],
  rowKey: keyof RowType & string,
  onRowClick: MouseEventHandler<HTMLTableRowElement> | undefined,
): ReactElement[] {
  const bodyRows: ReactElement[] = [];
  const rowClassName = onRowClick ? "hover cursor-pointer" : undefined;
  for (const row of rows) {
    const cells = buildRowCells(row, columns);
    const keyValue = row[rowKey];
    const rowKeyText = String(keyValue);
    const bodyRow = (
      <tr key={rowKeyText} data-row-key={rowKeyText} className={rowClassName} onClick={onRowClick}>
        {cells}
      </tr>
    );
    bodyRows.push(bodyRow);
  }
  return bodyRows;
}

export function TypeTable<RowType>(props: TypeTableProps<RowType>) {
  const { rows, columns, rowKey, isLoading = false, emptyKey = "ui.noData", onRowClick, className } = props;
  const { t } = useUi();

  if (isLoading) {
    return <SkeletonTable />;
  }

  const headerCells = buildHeaderCells(columns, t);
  const bodyRows = buildBodyRows(rows, columns, rowKey, onRowClick);
  const isEmpty = rows.length === 0;
  const classList = ["table table-zebra", className];
  const tableClassName = joinClassNames(classList);

  return (
    <table className={tableClassName}>
      <thead>
        <tr>{headerCells}</tr>
      </thead>
      <tbody>
        {isEmpty ? (
          <tr>
            <td colSpan={columns.length}>
              <EmptyState titleKey={emptyKey} />
            </td>
          </tr>
        ) : (
          bodyRows
        )}
      </tbody>
    </table>
  );
}
