// skeleton-menu.tsx
// Placeholder rows shown in the sidebar while menus load.

import type { ReactElement } from "react";

const SKELETON_MENU_ROWS = 6;

/** Builds the placeholder rows. */
function buildMenuRows(rowCount: number): ReactElement[] {
  const rows: ReactElement[] = [];
  for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
    const row = (
      <div key={rowIndex} className="flex items-center gap-3 px-3 py-2">
        <div className="skeleton size-5 shrink-0 rounded" />
        <div className="skeleton h-4 flex-1" />
      </div>
    );
    rows.push(row);
  }
  return rows;
}

export function SkeletonMenu() {
  const rows = buildMenuRows(SKELETON_MENU_ROWS);
  return (
    <div className="flex flex-col gap-1 p-3" aria-hidden="true">
      {rows}
    </div>
  );
}
