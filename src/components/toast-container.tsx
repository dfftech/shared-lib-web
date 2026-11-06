// toast-container.tsx
// Shows the messages from ShowToast(). Rendered once by SharedWebUiProvider.

import type { MouseEvent, ReactElement } from "react";
import { useUi } from "../context/use-ui.ts";
import type { ToastItem, ToastType } from "../interfaces/toast.ts";
import type { ToastPosition } from "../interfaces/ui-config.ts";
import { toastsSignal } from "../state/signals.ts";
import { removeToast } from "../state/toast-service.ts";
import { TypeIcon } from "../types/type.icon.ts";

const TOAST_TYPE_CLASSES: Record<ToastType, string> = {
  info: "alert alert-info",
  success: "alert alert-success",
  warning: "alert alert-warning",
  error: "alert alert-error",
};

const TOAST_POSITION_CLASSES: Record<ToastPosition, string> = {
  "top-start": "toast toast-top toast-start",
  "top-center": "toast toast-top toast-center",
  "top-end": "toast toast-top toast-end",
  "bottom-start": "toast toast-bottom toast-start",
  "bottom-center": "toast toast-bottom toast-center",
  "bottom-end": "toast toast-bottom toast-end",
};

/** Closes the toast whose id is in the button's data-toast-id attribute. */
export function handleToastCloseClick(event: MouseEvent<HTMLButtonElement>): void {
  const button = event.currentTarget;
  const toastId = button.dataset.toastId;
  if (toastId) {
    removeToast(toastId);
  }
}

/** Builds one alert per toast. */
function buildToastElements(toasts: ToastItem[], closeText: string): ReactElement[] {
  const toastElements: ReactElement[] = [];
  for (const toast of toasts) {
    const toastClassName = TOAST_TYPE_CLASSES[toast.type];
    const toastRole = toast.type === "error" ? "alert" : "status";
    const toastElement = (
      <div key={toast.id} role={toastRole} className={toastClassName}>
        <span>{toast.message}</span>
        <button
          type="button"
          className="btn btn-ghost btn-xs btn-circle"
          aria-label={closeText}
          data-toast-id={toast.id}
          onClick={handleToastCloseClick}
        >
          <TypeIcon name="X" size={14} />
        </button>
      </div>
    );
    toastElements.push(toastElement);
  }
  return toastElements;
}

export function ToastContainer() {
  const { t, config } = useUi();
  const toasts = toastsSignal.value;
  if (toasts.length === 0) {
    return null;
  }
  const closeText = t("ui.close");
  const toastElements = buildToastElements(toasts, closeText);
  const position = config.layout?.toastPosition ?? "top-end";
  const positionClass = TOAST_POSITION_CLASSES[position];
  return <div className={`${positionClass} z-[70]`}>{toastElements}</div>;
}
