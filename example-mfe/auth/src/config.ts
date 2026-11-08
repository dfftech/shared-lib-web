// config.ts — the config of the auth MFE (the login page; each MFE has its own copy of the common parts).
// Same appNameKey ("ORG") in the shell and every MFE, so they all read the same localStorage keys:
//   ORG-THEME  the theme the user picked     ORG-LANG  the language     ORG-LAYOUT_CHOICE  the shell layout
// <SharedWebUiProvider type="mfe" config={config}> applies the saved theme and language on mount.
// No menu, no branches (type "mfe"). Unlike the other MFEs it loads the company details: the login shows the brand.
// Everything loaded is a signal, like in the shell: loadLocale: localeSignal, loadThemes: themesSignal,
// loadSupportLanguages: supportLangSignal, loadCompanyDetails: companySignal — filled by startConfigData() (mfe-page.tsx).

import { signal } from "@preact/signals-react";
import {
  AppHttp,
  fillLocaleBundle,
  readContent,
  readEnvData,
  toAbsoluteUrl,
  type CompanySource,
  type CustomThemesModule,
  type LangSource,
  type LocaleBundle,
  type LocaleModule,
  type UiConfig,
} from 'shared-lib-web';

/** Key / base name, the same in the shell and every MFE: ORG-THEME, ORG-LANG ... */
export const APP_NAME_KEY = 'ORGAPP';

/** Service name prefix: "ORG" -> /org-api. */
const APP_API_KEY = APP_NAME_KEY.toLowerCase();

/**
 * window.env.REACT_APP_ORG_API_BASE_URL, else "/api" on the page's site. Inside the shell: the shell's env.js (the
 * shell's backend); alone (npm run dev): this MFE's public/env.js.
 */
const envBaseUrl = readEnvData(APP_NAME_KEY, "API_BASE_URL");
const API_BASE_URL = toAbsoluteUrl(envBaseUrl ?? "/api");

/** Service paths (AppHttp adds the base URL). */
export const MsUrl = {
  main: `/${APP_API_KEY}-api`,
  sor: `/${APP_API_KEY}-sor`,
  utils: `/${APP_API_KEY}-util`,
};

/** The supported languages (backend reply): null until it arrives. */
export const supportLangSignal = signal<LangSource | null>(null);

/** The texts per language ({ "en-US": {...} }): the library asks for codes, startConfigData() loads them. */
export const localeSignal = signal<LocaleBundle | null>(null);

/** The custom themes (sor /content-load?query=theme): null until loaded. */
export const themesSignal = signal<CustomThemesModule | null>(null);

/** The company details (sor /company-details: app name, company name, favicon, logos): null until it arrives. */
export const companySignal = signal<CompanySource | null>(null);

/** true once the company details were requested (one request, also with StrictMode). */
let isCompanyRequested = false;

/** GET the company details once (sor /company-details). On an error: {} (the app key is shown). */
async function loadCompany(): Promise<void> {
  if (isCompanyRequested) {
    return;
  }
  isCompanyRequested = true;
  try {
    const reply = await AppHttp.GetShared(`${MsUrl.sor}/company-details`);
    companySignal.value = reply as CompanySource;
  } catch {
    companySignal.value = {};
  }
}

/** true once the languages were requested (one request, also with StrictMode). */
let isLanguageRequested = false;

/** GET the languages once (sor /load/LANG?active=true). On an error the default language stays. */
async function loadLanguages(): Promise<void> {
  if (isLanguageRequested) {
    return;
  }
  isLanguageRequested = true;
  try {
    const reply = await AppHttp.GetShared(`${MsUrl.sor}/load/LANG`, { active: true });
    supportLangSignal.value = reply as LangSource;
  } catch {
    supportLangSignal.value = null;
  }
}

/** The texts of one language: sor /content-load?query=locales.<code> (the groups inside: { "ui": {...}, "nav": {...} }). */
async function loadTexts(languageCode: string): Promise<LocaleModule> {
  const query = `locales.${languageCode}`;
  const reply = await AppHttp.GetShared(`${MsUrl.sor}/content-load`, { query: query });
  const messages = readContent(reply, query);
  return messages as LocaleModule;
}

/** true once the themes were requested (one request, also with StrictMode). */
let isThemeRequested = false;

/** GET the custom org themes (sor /content-load?query=theme: an object keyed by theme name) into themesSignal. */
async function loadThemeFile(): Promise<void> {
  if (isThemeRequested) {
    return;
  }
  isThemeRequested = true;
  try {
    const reply = await AppHttp.GetShared(`${MsUrl.sor}/content-load`, { query: "theme" });
    const themes = readContent(reply, "theme");
    themesSignal.value = themes as CustomThemesModule;
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

/** For useEffect in mfe-page.tsx: languages, company details, themes and texts of this MFE. Returns the cleanup. */
export function startConfigData(): () => void {
  void loadLanguages();
  void loadCompany();
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
  // Themes as a signal: the custom org themes (sor /content-load?query=theme, listed first) + all 35 DaisyUI themes.
  loadThemes: themesSignal,
  // The brand on the login page (AuthLayout -> AppBrand): logo, app name, favicon.
  loadCompanyDetails: companySignal,
  // The MFEs have no app header: no settings button, no menu.
  // pageMode "path" like the shell: openPage("/profiles") / PageLink here change the path (/profiles), so single-spa
  // in the shell mounts that MFE (without it an MFE would write ?page=profiles).
  layout: { showMenu: false, showScrollToTop: true, toastPosition: "top-end", pageMode: "path" },
  http: { baseUrl: API_BASE_URL },
};
