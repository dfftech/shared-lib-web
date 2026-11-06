// document-sync.ts
// Keeps the <html> element in sync with the signals:
//   <html lang="ar" dir="rtl" data-theme="dark">
// Uses a signals effect, so it updates automatically whenever a signal changes.

import { effect } from "@preact/signals-react";
import { directionSignal, localeSignal, themeSignal } from "./signals.ts";

let stopDocumentSync: (() => void) | null = null;

/** Writes the current theme, language and direction to <html>. */
export function applyDocumentAttributes(): void {
  const theme = themeSignal.value;
  const languageCode = localeSignal.value;
  const direction = directionSignal.value;
  const hasDocument = typeof document !== "undefined";
  if (!hasDocument) {
    return;
  }
  const htmlElement = document.documentElement;
  htmlElement.setAttribute("data-theme", theme);
  htmlElement.setAttribute("dir", direction);
  if (languageCode) {
    htmlElement.lang = languageCode;
  }
}

/** Starts the automatic sync. Safe to call many times: it only starts once. */
export function startDocumentSync(): void {
  if (stopDocumentSync) {
    return;
  }
  stopDocumentSync = effect(applyDocumentAttributes);
}

/** Stops the automatic sync (used by tests). */
export function stopDocumentSyncForTests(): void {
  if (!stopDocumentSync) {
    return;
  }
  stopDocumentSync();
  stopDocumentSync = null;
}
