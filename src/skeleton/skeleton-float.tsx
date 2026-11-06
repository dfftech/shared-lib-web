// skeleton-float.tsx
// Placeholder shown while the floating action buttons (FloatLayout) load.

export function SkeletonFloat() {
  return (
    <div className="flex gap-2" aria-hidden="true">
      <div className="skeleton size-12 rounded-full" />
    </div>
  );
}
