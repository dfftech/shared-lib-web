// top-progress.tsx
// Thin DaisyUI progress bar fixed at the top while ShowProgress(true) is active. Rendered by SharedWebUiProvider.

import { useSignals } from "@preact/signals-react/runtime";
import { progressSignal } from "../state/signals.ts";

export function TopProgress() {
  useSignals();
  const isRunning = progressSignal.value;
  if (!isRunning) {
    return null;
  }
  return <progress className="progress progress-primary fixed inset-x-0 top-0 z-[60] h-1 rounded-none" aria-label="Loading" />;
}
