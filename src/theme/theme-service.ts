// theme-service.ts
// Switches the DaisyUI theme and remembers it.
//
//   changeTheme("dark");  -> <html data-theme="dark">, saved to localStorage
//
// The <html> attribute is written by state/document-sync.ts.

import type { Theme, UiConfig } from "../interfaces/ui-config.ts";
import { themeSignal, uiConfigSignal } from "../state/signals.ts";
import { AppStorage } from "../utils/app-storage.ts";
import { THEME } from "../utils/storage-keys.ts";
import { DEFAULT_DARK_THEMES } from "./dark-themes.ts";

/** true when the theme is listed in the config. */
export function isKnownTheme(config: UiConfig, theme: string): boolean {
  const isListed = config.themes.includes(theme);
  return isListed;
}

/** Picks the theme to start with: the saved one if it is in the config, else the default. */
export function readInitialTheme(config: UiConfig): Theme {
  const storedTheme = AppStorage.getText(THEME);
  if (storedTheme) {
    const isStoredThemeKnown = isKnownTheme(config, storedTheme);
    if (isStoredThemeKnown) {
      return storedTheme;
    }
  }
  return config.defaultTheme;
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

/** The dark theme names: config.darkThemes, else the DaisyUI dark themes. */
export function readDarkThemeNames(): Theme[] {
  const config = uiConfigSignal.value;
  return config?.darkThemes ?? DEFAULT_DARK_THEMES;
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
