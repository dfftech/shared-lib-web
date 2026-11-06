// provider-effects.ts
// Start-up work run once by ThemeProvider and TranslationProvider.
// Kept as top-level functions so they can be passed straight to useEffect.

import { initializeLanguage, readActiveConfig } from "../i18n/locale-service.ts";
import { isTranslationReadySignal } from "../state/signals.ts";
import { startDocumentSync } from "../state/document-sync.ts";
import { initializeTheme } from "../theme/theme-service.ts";

/** Empty dependency list: run the effect only once. */
export const RUN_ONCE: never[] = [];

/** Applies the saved theme and starts syncing <html> attributes. */
export function initializeThemeOnMount(): void {
  const config = readActiveConfig();
  initializeTheme(config);
  startDocumentSync();
}

/** Shows the app even when a locale file fails, so the screen is never stuck on loading. */
export function handleLanguageLoadError(error: unknown): void {
  console.error("shared-lib-web: could not load the locale file.", error);
  isTranslationReadySignal.value = true;
}

/** Loads the saved (or default) language. */
export function initializeLanguageOnMount(): void {
  const loadingLanguage = initializeLanguage();
  loadingLanguage.catch(handleLanguageLoadError);
}
