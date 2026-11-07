// theme-service.ts
// Switches the DaisyUI theme and remembers it.
//
//   changeTheme("dark");  -> <html data-theme="dark">, saved to localStorage
//
// First visit (nothing saved): config.defaultTheme, or without it the browser preference
// (prefers-color-scheme: dark -> "dark", otherwise "light").
//
// The <html> attribute is written by state/document-sync.ts.

import type { Theme, UiConfig } from "../interfaces/ui-config.ts";
import { customThemesSignal, themeSignal, uiConfigSignal } from "../state/signals.ts";
import { AppStorage } from "../utils/app-storage.ts";
import { THEME } from "../utils/storage-keys.ts";
import { buildDarkThemeNames, buildThemeNames } from "./dark-themes.ts";

/** The theme names of the switcher: the custom themes first, then config.themes (default: all DaisyUI themes). */
export function readThemeNames(config: UiConfig): Theme[] {
  const customThemes = customThemesSignal.value;
  return buildThemeNames(config.themes, customThemes);
}

/** true when the theme is offered (config.themes or a custom theme). */
export function isKnownTheme(config: UiConfig, theme: string): boolean {
  const themeNames = readThemeNames(config);
  return themeNames.includes(theme);
}

const DARK_SCHEME_QUERY = "(prefers-color-scheme: dark)";

/** true when the browser / OS asks for a dark colour scheme. */
function isBrowserDarkPreferred(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  const darkQuery = window.matchMedia(DARK_SCHEME_QUERY);
  return darkQuery.matches;
}

/** The first-visit theme: config.defaultTheme, else "dark" or "light" from the browser preference. */
export function readDefaultTheme(config: UiConfig): Theme {
  if (config.defaultTheme) {
    return config.defaultTheme;
  }
  const isDarkPreferred = isBrowserDarkPreferred();
  return isDarkPreferred ? "dark" : "light";
}

/**
 * Picks the theme to start with: the saved one if it is in the config, else the default.
 * With config.loadThemes the saved theme is kept while the custom themes load (no flash of the default theme).
 */
export function readInitialTheme(config: UiConfig): Theme {
  const storedTheme = AppStorage.getText(THEME);
  if (storedTheme) {
    const isStoredThemeKnown = isKnownTheme(config, storedTheme);
    const isThemeLoading = Boolean(config.loadThemes);
    if (isStoredThemeKnown || isThemeLoading) {
      return storedTheme;
    }
  }
  return readDefaultTheme(config);
}

/** After config.loadThemes: a theme that is still unknown (not in the loaded list) falls back to the default. */
export function leaveUnknownTheme(): void {
  const config = uiConfigSignal.peek();
  if (!config) {
    return;
  }
  const currentTheme = themeSignal.peek();
  const isCurrentThemeKnown = isKnownTheme(config, currentTheme);
  if (!isCurrentThemeKnown) {
    themeSignal.value = readDefaultTheme(config);
  }
}

/** Custom themes can arrive after the start (fetched JSON): switch to the saved theme once it is known. */
export function applySavedThemeWhenKnown(): void {
  const config = uiConfigSignal.peek();
  const storedTheme = AppStorage.getText(THEME);
  if (!config || !storedTheme || storedTheme === themeSignal.peek()) {
    return;
  }
  const isStoredThemeKnown = isKnownTheme(config, storedTheme);
  if (isStoredThemeKnown) {
    themeSignal.value = storedTheme;
  }
}

/** Switches the theme. Themes not listed in the config are ignored. */
export function changeTheme(theme: Theme): void {
  const config = uiConfigSignal.value;
  if (config) {
    const isThemeKnown = isKnownTheme(config, theme);
    if (!isThemeKnown) {
      return;
    }
  }
  themeSignal.value = theme;
  AppStorage.setData(THEME, theme);
}

/** Themes grouped for the switchers: light ones and dark ones (config order kept). */
export interface ThemeGroups {
  lightThemes: Theme[];
  darkThemes: Theme[];
}

/** The dark theme names: the dark custom themes + (config.darkThemes, else the DaisyUI dark themes). */
export function readDarkThemeNames(): Theme[] {
  const config = uiConfigSignal.value;
  const customThemes = customThemesSignal.value;
  return buildDarkThemeNames(config?.darkThemes, customThemes);
}

/** true when the theme has a dark background. */
export function isDarkThemeName(theme: Theme): boolean {
  const darkThemeNames = readDarkThemeNames();
  return darkThemeNames.includes(theme);
}

/** Splits themes into light and dark ones: { lightThemes: [...], darkThemes: [...] }. */
export function splitThemesByMode(themes: Theme[]): ThemeGroups {
  const lightThemes: Theme[] = [];
  const darkThemes: Theme[] = [];
  for (const theme of themes) {
    const isDark = isDarkThemeName(theme);
    if (isDark) {
      darkThemes.push(theme);
    } else {
      lightThemes.push(theme);
    }
  }
  return { lightThemes: lightThemes, darkThemes: darkThemes };
}

/** Sets the saved (or default) theme without saving it again. */
export function initializeTheme(config: UiConfig): void {
  const initialTheme = readInitialTheme(config);
  themeSignal.value = initialTheme;
}
