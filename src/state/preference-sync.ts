// preference-sync.ts
// Keeps the theme, language, menu mode and layout choice the same in every copy of the library on the page — for microfrontends,
// where each MFE bundles its own shared-lib-web — and in other tabs.
//
//   AppStorage.setData(THEME | LANG, ...)  -> fires window event PREFERENCE_EVENT (same tab, storage-keys.ts)
//   another tab saves THEME | LANG         -> the browser fires a "storage" event
//   every provider listens to both and applies the saved value without saving it again (no event loop).

import { applyLanguage } from "../i18n/locale-service.ts";
import { isKnownTheme } from "../theme/theme-service.ts";
import { AppStorage, readPrefixedKey } from "../utils/app-storage.ts";
import { LANG, LAYOUT_CHOICE, MENU_MODE, PREFERENCE_EVENT, THEME } from "../utils/storage-keys.ts";
import { applySavedLayoutChoice } from "./layout-choice-service.ts";
import { localeSignal, navigationModeSignal, themeSignal, uiConfigSignal } from "./signals.ts";

let isPreferenceSyncStarted = false;

/** Applies the saved theme when it differs (not saved again). */
export function applySavedTheme(): void {
  const config = uiConfigSignal.peek();
  const savedTheme = AppStorage.getText(THEME);
  if (!config || !savedTheme || savedTheme === themeSignal.peek()) {
    return;
  }
  const isKnown = isKnownTheme(config, savedTheme);
  if (isKnown) {
    themeSignal.value = savedTheme;
  }
}

/** Applies the saved language when it differs (not saved again). */
export function applySavedLanguage(): void {
  const savedLanguage = AppStorage.getText(LANG);
  if (!savedLanguage || savedLanguage === localeSignal.peek()) {
    return;
  }
  void applyLanguage(savedLanguage, false);
}

/** Applies the saved menu mode ("sidebar" / "megamenu") when it differs (not saved again). */
export function applySavedMenuMode(): void {
  const savedMode = AppStorage.getText(MENU_MODE);
  const isKnownMode = savedMode === "sidebar" || savedMode === "megamenu";
  if (isKnownMode && savedMode !== navigationModeSignal.peek()) {
    navigationModeSignal.value = savedMode;
  }
}

/** Applies the preference named by the key ("THEME", "LANG", "MENU_MODE" or "LAYOUT_CHOICE"). */
export function applySavedPreference(key: string): void {
  if (key === THEME) {
    applySavedTheme();
  }
  if (key === LANG) {
    applySavedLanguage();
  }
  if (key === MENU_MODE) {
    applySavedMenuMode();
  }
  if (key === LAYOUT_CHOICE) {
    applySavedLayoutChoice();
  }
}

/** Same tab: another library copy (or this one) saved a preference. */
export function handlePreferenceEvent(event: Event): void {
  const detail = (event as CustomEvent<{ key?: string }>).detail;
  const key = detail?.key ?? "";
  applySavedPreference(key);
}

/** Other tab: localStorage changed. */
export function handleStorageEvent(event: StorageEvent): void {
  const themeKey = readPrefixedKey(THEME);
  const languageKey = readPrefixedKey(LANG);
  const menuModeKey = readPrefixedKey(MENU_MODE);
  const layoutChoiceKey = readPrefixedKey(LAYOUT_CHOICE);
  if (event.key === themeKey) {
    applySavedTheme();
  }
  if (event.key === languageKey) {
    applySavedLanguage();
  }
  if (event.key === menuModeKey) {
    applySavedMenuMode();
  }
  if (event.key === layoutChoiceKey) {
    applySavedLayoutChoice();
  }
}

/** Starts listening once (called by SharedWebUiProvider). */
export function startPreferenceSync(): void {
  const hasWindow = typeof window !== "undefined";
  if (!hasWindow || isPreferenceSyncStarted) {
    return;
  }
  isPreferenceSyncStarted = true;
  window.addEventListener(PREFERENCE_EVENT, handlePreferenceEvent);
  window.addEventListener("storage", handleStorageEvent);
}
