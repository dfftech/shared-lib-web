// config.ts — the shell config: the same appNameKey, languages and themes as the MFEs + the app shell parts.
// Everything loaded is a signal (session.ts fills them): localeSignal, themesSignal and supportLangSignal on start,
// navSignal after sign in (also after a refresh).
import { signal } from "@preact/signals-react";
import {
  toAbsoluteUrl,
  type CustomThemesModule,
  type LangSource,
  type LocaleBundle,
  type MenuSource,
  type UiConfig,
} from "shared-lib-web";

/** Key / base name, the same in the shell and every MFE: ORG-THEME, ORG-LANG ... */
export const APP_NAME_KEY = "ORG";

/** Service name prefix: "ORG" -> /org-api. */
const APP_API_KEY = APP_NAME_KEY.toLowerCase();

/** API of the shell ("/api" on this site; the fake backend is public/api). */
export const API_BASE_URL = toAbsoluteUrl("/api");

/** Service paths (AppHttp adds the base URL): MsUrl.main + "/menu-access.json" -> /api/org-api/menu-access.json. */
export const MsUrl = {
  main: `/${APP_API_KEY}-api`,
};

/** The supported languages (backend reply): null until it arrives. */
export const supportLangSignal = signal<LangSource | null>(null);

/** The menu of the signed-in user (backend reply): null = menu skeleton. */
export const navSignal = signal<MenuSource | null>(null);

/** The texts per language ({ "en-US": {...} }): the library asks for codes, session.ts loads them. */
export const localeSignal = signal<LocaleBundle | null>(null);

/** The custom themes (theme/org-themes.json): null until loaded. */
export const themesSignal = signal<CustomThemesModule | null>(null);

export const shellConfig: UiConfig = {
  appNameKey: APP_NAME_KEY,
  // The texts as a signal: { "en-US": {...}, ... }; the library asks for languages, the app loads them.
  loadLocale: localeSignal,
  // The languages as a signal (public/api/org-api/languages.json, loaded on start by session.ts).
  loadSupportLanguages: supportLangSignal,
  // Themes as a signal: the custom org themes (theme/org-themes.json, listed first) + all 35 DaisyUI themes.
  loadThemes: themesSignal,
  appName: "app.name",
  homePath: "/",
  logoUrl: "/logo-light.svg",
  logoDarkUrl: "/logo-dark.svg",
  // The shell owns the header (settings dialog for language / theme, user menu) and the side menu.
  // <SharedWebUiProvider type="shell">: pages are real paths — /settings, /forms, /profile (not ?page=settings).
  layout: { menuMode: "sidebar", isSidebarCollapsible: true, headerSettings: "menu", toastPosition: "top-end" },
  http: { baseUrl: API_BASE_URL, logoutUrl: "/" },
  // The menu of the signed-in user as a signal (fake backend: public/api/org-api/menu-access.json).
  loadMenuNavigation: navSignal,
};
