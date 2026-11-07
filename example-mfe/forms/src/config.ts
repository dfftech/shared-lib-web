// config.ts — the config of this MFE (each MFE has its own copy; keep the common parts the same in every project).
// Same appNameKey ("ORG") in the shell and every MFE, so they all read the same localStorage keys:
//   ORG-THEME  the theme the user picked     ORG-LANG  the language     ORG-LAYOUT_CHOICE  the shell layout
// <SharedWebUiProvider type="mfe" config={config}> applies the saved theme and language on mount.
// No menu, no branches, no logos, no appName (type "mfe": the shell owns them); the MFE has page layouts only.
// The languages come from the backend as a signal (loadSupportLanguages: langSignal), like in the shell.

import { signal } from "@preact/signals-react";
import {
  AppHttp,
  loadLocaleGroups,
  toAbsoluteUrl,
  type CustomThemesModule,
  type LangSource,
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
export const langSignal = signal<LangSource | null>(null);

/** true once the languages were requested (one request, also with StrictMode). */
let isLanguageRequested = false;

/** GET the languages once (public/api/org-api/languages.json). On an error the default language stays. */
export async function loadLanguages(): Promise<void> {
  if (isLanguageRequested) {
    return;
  }
  isLanguageRequested = true;
  try {
    const reply = await AppHttp.Get(`${MsUrl.main}/languages.json`);
    langSignal.value = reply as LangSource;
  } catch {
    langSignal.value = null;
  }
}

/**
 * The texts: src/locales/<code>/<group>.json (ui, root + this MFE's own group).
 * Lazy: only the files of the language in use are downloaded.
 */
const localeFiles = import.meta.glob("./locales/*/*.json");

/** The custom org themes (theme/org-themes.json), loaded lazily like the locale files. */
function loadThemes(): Promise<CustomThemesModule> {
  return import("./theme/org-themes.json");
}

export const config: UiConfig = {
  appNameKey: APP_NAME_KEY,
  // No defaultLanguage: the first visit uses the browser / system language (when listed), else en-US.
  loadLocale: loadLocaleGroups.bind(null, localeFiles),
  // The languages as a signal: every new value is shown at once (null = no list yet).
  loadSupportLanguages: langSignal,
  // Themes: the custom org themes (loadThemes -> theme/org-themes.json, listed first) + all 35 DaisyUI themes.
  loadThemes: loadThemes,
  // The MFEs have no app header: no settings button, no menu.
  layout: { showMenu: false, showScrollToTop: true, toastPosition: "top-end" },
  http: { baseUrl: API_BASE_URL },
};
