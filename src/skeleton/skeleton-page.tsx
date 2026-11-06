// skeleton-page.tsx
// Placeholder for a whole page: header card and a table card. Default page fallback of AppLayout.

import { SkeletonArticle } from "./skeleton-article.tsx";
import { SkeletonTable } from "./skeleton-table.tsx";

export function SkeletonPage() {
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      <div className="rounded-box bg-base-100 p-4 shadow-sm">
        <SkeletonArticle />
      </div>
      <div className="rounded-box bg-base-100 shadow-sm">
        <SkeletonTable />
      </div>
    </div>
  );
}
