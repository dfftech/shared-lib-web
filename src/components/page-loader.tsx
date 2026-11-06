// page-loader.tsx
// A full-screen centred spinner. Shown while the first locale file loads.
// It does not use translations because they may not be loaded yet.

export function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center" role="status" aria-busy="true">
      <span className="loading loading-spinner loading-lg text-primary" />
    </div>
  );
}
