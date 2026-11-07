// config.ts — the config of this MFE (each MFE has its own copy; keep the common parts the same in every project).
// Same appNameKey ("ORG") in the shell and every MFE, so they all read the same localStorage keys:
//   ORG-THEME  the theme the user picked     ORG-LANG  the language     ORG-LAYOUT_CHOICE  the shell layout
// <SharedWebUiProvider type="mfe" config={config}> applies the saved theme and language on mount.
// No menu, no branches, no logos, no appName (type "mfe": the shell owns them); the MFE has page layouts only.
// Everything loaded is a signal, like in the shell: loadLocale: localeSignal, loadThemes: themesSignal,
// loadSupportLanguages: supportLangSignal — filled by startConfigData() (mfe-page.tsx).

import { signal } from "@preact/signals-react";
import {
  AppHttp,
  fillLocaleBundle,
  loadLocaleGroups,
  toAbsoluteUrl,
  type CustomThemesModule,
  type LangSource,
  type LocaleBundle,
  type UiConfig,
} from "shared-lib-web";

/** Key / base name, the same in the shell and every MFE: ORG-THEME, ORG-LANG ... */
export const APP_NAME_KEY = "ORG";

/** Service name prefix: "ORG" -> /org-api. */
const APP_API_KEY = APP_NAME_KEY.toLowerCase();

/** "/api" on the page's site: inside the shell the shell's backend, alone this MFE's public/api. */
const API_BASE_URL = toAbsoluteUrl("/api");

/** Service paths (AppHttp adds the base URL). */
export const MsUrl = {
  main: `/${APP_API_KEY}-api`,
};

/** The supported languages (backend reply): null until it arrives. */
export const supportLangSignal = signal<LangSource | null>(null);

/** The texts per language ({ "en-US": {...} }): the library asks for codes, startConfigData() loads them. */
export const localeSignal = signal<LocaleBundle | null>(null);

/** The custom themes (theme/org-themes.json): null until loaded. */
export const themesSignal = signal<CustomThemesModule | null>(null);

/** true once the languages were requested (one request, also with StrictMode). */
let isLanguageRequested = false;

/** GET the languages once (public/api/org-api/languages.json). On an error the default language stays. */
async function loadLanguages(): Promise<void> {
  if (isLanguageRequested) {
    return;
  }
  isLanguageRequested = true;
  try {
    const reply = await AppHttp.Get(`${MsUrl.main}/languages.json`);
    supportLangSignal.value = reply as LangSource;
  } catch {
    supportLangSignal.value = null;
  }
}

/** The texts: ./locales/<code>/<group>.json — lazy, only the languages the library asks for are loaded. */
const localeFiles = import.meta.glob("./locales/*/*.json");
const loadTexts = loadLocaleGroups.bind(null, localeFiles);

/** true once the theme file was requested (one request, also with StrictMode). */
let isThemeRequested = false;

/** Loads the custom org themes (./theme/org-themes.json) into themesSignal. */
async function loadThemeFile(): Promise<void> {
  if (isThemeRequested) {
    return;
  }
  isThemeRequested = true;
  try {
    const themeModule = await import("./theme/org-themes.json");
    themesSignal.value = themeModule as CustomThemesModule;
  } catch {
    themesSignal.value = [];
  }
}

/** Stops every follower started by startConfigData. */
function stopAll(stoppers: Array<() => void>): void {
  for (const stop of stoppers) {
    stop();
  }
}

/** For useEffect in mfe-page.tsx: languages, themes and texts of this MFE. Returns the cleanup. */
export function startConfigData(): () => void {
  void loadLanguages();
  void loadThemeFile();
  const stopTexts = fillLocaleBundle(localeSignal, loadTexts);
  return stopAll.bind(null, [stopTexts]);
}

export const config: UiConfig = {
  appNameKey: APP_NAME_KEY,
  // No defaultLanguage: the first visit uses the browser / system language (when listed), else en-US.
  // The texts as a signal: { "en-US": {...}, ... }; the library asks for languages, the app loads them.
  loadLocale: localeSignal,
  // The languages as a signal: every new value is shown at once (null = no list yet).
  loadSupportLanguages: supportLangSignal,
  // Themes as a signal: the custom org themes (theme/org-themes.json, listed first) + all 35 DaisyUI themes.
  loadThemes: themesSignal,
  // The MFEs have no app header: no settings button, no menu.
  layout: { showMenu: false, showScrollToTop: true, toastPosition: "top-end" },
  http: { baseUrl: API_BASE_URL },
};
