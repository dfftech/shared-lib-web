// config.ts — the shell config: the same appNameKey, languages and themes as the MFEs + the app shell parts.
// Everything loaded is a signal (session.ts fills them): localeSignal, themesSignal, supportLangSignal and companySignal on start,
// navSignal after sign in (also after a refresh).
import { signal } from "@preact/signals-react";
import {
  readEnvData,
  toAbsoluteUrl,
  type CompanySource,
  type CustomThemesModule,
  type LangSource,
  type LocaleBundle,
  type MenuSource,
  type UiConfig,
} from 'shared-lib-web';

/** Key / base name, the same in the shell and every MFE: ORG-THEME, ORG-LANG ... */
export const APP_NAME_KEY = "ORG";

/** Service name prefix: "ORG" -> /org-api. */
const APP_API_KEY = APP_NAME_KEY.toLowerCase();

/** window.env.REACT_APP_ORG_API_BASE_URL (public/env.js), else "/api" on this site. */
const envBaseUrl = readEnvData(APP_NAME_KEY, "API_BASE_URL");
export const API_BASE_URL = toAbsoluteUrl(envBaseUrl ?? "/api");

/** Service paths (AppHttp adds the base URL): MsUrl.sor + "/company-details" -> /api/org-sor/company-details.
 * From sor: company details, languages, locales, themes; from utils: the menu (/authorization/<persona>). */
export const MsUrl = {
  main: `/${APP_API_KEY}-api`,
  sor: `/${APP_API_KEY}-sor`,
  utils: `/${APP_API_KEY}-util`,
};

/** The supported languages (backend reply): null until it arrives. */
export const supportLangSignal = signal<LangSource | null>(null);

/** The menu of the signed-in user (backend reply): null = menu skeleton. */
export const navSignal = signal<MenuSource | null>(null);

/** The texts per language ({ "en-US": {...} }): the library asks for codes, session.ts loads them. */
export const localeSignal = signal<LocaleBundle | null>(null);

/** The custom themes (sor /content-load?query=theme): null until loaded. */
export const themesSignal = signal<CustomThemesModule | null>(null);

/** The company details (backend reply: appName, companyName, faviconUrl, logoUrl, logoDarkUrl): null until it arrives. */
export const companySignal = signal<CompanySource | null>(null);

export const shellConfig: UiConfig = {
  appNameKey: APP_NAME_KEY,
  // The texts as a signal: { "en-US": {...}, ... }; the library asks for languages, the app loads them.
  loadLocale: localeSignal,
  // The languages as a signal (sor /load/LANG?active=true, loaded on start by session.ts).
  loadSupportLanguages: supportLangSignal,
  // The brand comes from the company details (sor /company-details), not from this config:
  // appName (label + tab title), logoUrl / logoDarkUrl, faviconUrl; companyName is the logo alt text.
  loadCompanyDetails: companySignal,
  // Themes as a signal: the custom org themes (sor /content-load?query=theme, listed first) + all 35 DaisyUI themes.
  loadThemes: themesSignal,
  // Home with a token (logo link, the page of a bare "/"); without a token the auth MFE (/auth?page=login), see session.ts.
  homePath: '/dashboard',
  // The shell owns the header (settings dialog for language / theme, user menu) and the side menu.
  // <SharedWebUiProvider type="shell">: pages are real paths — /settings, /forms, /profile (not ?page=settings).
  layout: { menuMode: 'sidebar', isSidebarCollapsible: true, headerSettings: 'menu', toastPosition: 'top-end' },
  http: { baseUrl: API_BASE_URL, logoutUrl: '/' },
  // The menu of the signed-in user as a signal (util /authorization/<persona>?roles=<roles>).
  loadMenuNavigation: navSignal,
};
