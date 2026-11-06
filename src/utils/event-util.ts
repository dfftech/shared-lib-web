// event-util.ts
// Small helpers for click handlers that carry their value in data-* attributes
// (so no arrow function is needed inside components).
//
//   <TypeButton dataValue={user.id} onPress={handleDeleteClick} />
//   function handleDeleteClick(event: MouseEvent<HTMLButtonElement>) { const userId = readDataValue(event); }

import { ConstValue } from "dff-util";
import type { SyntheticEvent } from "react";
import { closeMegaMenu, closeRailFlyout } from "../state/navigation-service.ts";

/** Returns data-value of the element that has the handler. Empty text when missing. */
export function readDataValue(event: SyntheticEvent<HTMLElement>): string {
  const element = event.currentTarget;
  const dataValue = element.dataset.value;
  return dataValue ?? ConstValue.EMPTY;
}

/**
 * Escape key handler for the whole page: closes the top-most overlay (modal, drawer, confirm)
 * by clicking its element marked data-overlay-close, otherwise the mega menu and rail flyout.
 * Started once by SharedWebUiProvider.
 */
export function handleDocumentEscape(event: KeyboardEvent): void {
  if (event.key !== "Escape") {
    return;
  }
  const closeButtons = document.querySelectorAll<HTMLElement>("[data-overlay-close]");
  const lastIndex = closeButtons.length - 1;
  const topCloseButton = closeButtons[lastIndex];
  if (topCloseButton) {
    topCloseButton.click();
    return;
  }
  closeMegaMenu();
  closeRailFlyout();
}

let isEscapeListenerStarted = false;

/** Starts the page-wide Escape handler. Safe to call many times. */
export function startEscapeListener(): void {
  if (isEscapeListenerStarted) {
    return;
  }
  isEscapeListenerStarted = true;
  document.addEventListener("keydown", handleDocumentEscape);
}

/** Goes back one page in the browser history. */
export function goBackInHistory(): void {
  window.history.back();
}

/** Reloads the page. */
export function reloadPage(): void {
  window.location.reload();
}
