// skeleton-article.tsx
// Placeholder shown while a page header (ArticleLayout) loads.

export function SkeletonArticle() {
  return (
    <div className="flex flex-col gap-3" aria-hidden="true">
      <div className="skeleton h-8 w-1/3" />
      <div className="skeleton h-4 w-2/3" />
    </div>
  );
}
