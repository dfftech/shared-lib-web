// toast-service.ts
// Shows short messages in the corner of the screen.
//
//   ShowToast("Saved", "success");
//   ShowToast(t(ConstKeys.WENT_WRONG), "warning", 5000);
//
// <SharedWebUiProvider> already renders the ToastContainer.

import { AppUUID4 } from "dff-util";
import type { ToastItem, ToastType } from "../interfaces/toast.ts";
import { toastsSignal } from "./signals.ts";

export const DEFAULT_TOAST_DURATION_MS = 3000;

/** Removes one toast by id. */
export function removeToast(toastId: string): void {
  const remainingToasts: ToastItem[] = [];
  for (const toast of toastsSignal.value) {
    if (toast.id !== toastId) {
      remainingToasts.push(toast);
    }
  }
  toastsSignal.value = remainingToasts;
}

/** Shows a toast. durationMs = 0 keeps it until closed. Returns the toast id. */
export function ShowToast(
  message: string,
  type: ToastType = "info",
  durationMs: number = DEFAULT_TOAST_DURATION_MS,
): string {
  const toastId = AppUUID4();
  const newToast: ToastItem = { id: toastId, message: message, type: type };
  const currentToasts = toastsSignal.value;
  toastsSignal.value = [...currentToasts, newToast];
  if (durationMs > 0) {
    setTimeout(removeToast, durationMs, toastId);
  }
  return toastId;
}

/** Removes every toast. */
export function clearToasts(): void {
  toastsSignal.value = [];
}
