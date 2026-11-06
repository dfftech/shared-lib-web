// toast.ts
// Types for toast messages.

/** Kind of message. Matches DaisyUI alert colours. */
export type ToastType = "info" | "success" | "warning" | "error";

/** One visible toast. */
export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}
