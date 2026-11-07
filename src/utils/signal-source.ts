// signal-source.ts
// Config values that can be a signal (loadLocale, loadThemes, loadSupportLanguages, loadBranches, loadMenuNavigation).
// A signal is recognised by its shape (value, peek, subscribe), so a signal from another copy of the signals package
// (each microfrontend bundles its own) works too.

import type { ValueSignal } from "../interfaces/ui-config.ts";

/** true when the value is a signal (or a computed). */
export function isSignalSource(source: unknown): source is ValueSignal<unknown> {
  if (typeof source !== "object" || source === null) {
    return false;
  }
  const candidate = source as Partial<ValueSignal<unknown>>;
  return typeof candidate.peek === "function" && typeof candidate.subscribe === "function" && "value" in candidate;
}
