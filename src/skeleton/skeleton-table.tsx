// skeleton-table.tsx
// Placeholder shown while a table (GridLayout) loads.

import type { ReactElement } from "react";

const SKELETON_ROW_COUNT = 6;

/** Builds the grey placeholder rows. */
function buildSkeletonRows(rowCount: number): ReactElement[] {
  const rows: ReactElement[] = [];
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    const row = <div key={rowIndex} className="skeleton h-10 w-full" />;
    rows.push(row);
  }
  return rows;
}

export function SkeletonTable() {
  const rows = buildSkeletonRows(SKELETON_ROW_COUNT);
  return (
    <div className="flex flex-col gap-2 p-4" aria-hidden="true">
      {rows}
    </div>
  );
}
