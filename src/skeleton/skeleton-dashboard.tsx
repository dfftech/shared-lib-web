// skeleton-dashboard.tsx
// Placeholder for a dashboard: four stat tiles and two chart blocks.

import type { ReactElement } from "react";

const STAT_TILE_COUNT = 4;

/** Builds the stat tile placeholders. */
function buildStatTiles(tileCount: number): ReactElement[] {
  const tiles: ReactElement[] = [];
  for (let tileIndex = 0; tileIndex < tileCount; tileIndex += 1) {
    const tile = (
      <div key={tileIndex} className="flex flex-col gap-2 rounded-box bg-base-100 p-4 shadow-sm">
        <div className="skeleton h-4 w-24" />
        <div className="skeleton h-8 w-16" />
      </div>
    );
    tiles.push(tile);
  }
  return tiles;
}

export function SkeletonDashboard() {
  const tiles = buildStatTiles(STAT_TILE_COUNT);
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">{tiles}</div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="skeleton h-64 w-full" />
        <div className="skeleton h-64 w-full" />
      </div>
    </div>
  );
}
