// config.ts
// The static shell setup: app key, service URLs (MsUrl), default language + locale loader, themes, logos, layout, http.
// No router: the current page is the ?page query parameter (see app.tsx).
// NOT here (they come from the backend, passed to <SharedWebUiProvider>):
//   nav  = the menu       (nav/nav.service.ts)
//   lang = the languages  (lang/lang.service.ts)

import { readEnvData, toAbsoluteUrl, type LocaleModule, type UiConfig } from "shared-lib-web";
import { DARK_THEMES, THEMES } from "./theme/themes.ts";

/** Key / base name (ENV_BASE_NAME): AppStorage keys ORG-TOKEN, ORG-LANG ...; window.env REACT_APP_ORG_... */
const APP_NAME_KEY = "ORG";

/** window.env.REACT_APP_ORG_API_BASE_URL (public/env.js), else "/api" on this site. */
const envBaseUrl = readEnvData(APP_NAME_KEY, "API_BASE_URL");
const API_BASE_URL = toAbsoluteUrl(envBaseUrl ?? "/api");

/** Service URLs of this project. */
export const MsUrl = {
  api: `${API_BASE_URL}/app-api`,
  main: `${API_BASE_URL}/app-api`,
  sor: `${API_BASE_URL}/app-sor`,
  events: `${API_BASE_URL}/app-events`,
  tms: `${API_BASE_URL}/app-tms`,
  utils: `${API_BASE_URL}/app-util`,
};

/** Loads locales/{code}.json only when that language is used ("en-US" -> locales/en-US.json). */
function loadLocale(languageCode: string): Promise<LocaleModule> {
  return import(`./locales/${languageCode}.json`);
}

export const config: UiConfig = {
  appNameKey: APP_NAME_KEY,
  // Label: t("app.name") from the locale files.
  appName: "app.name",
  defaultLanguage: "en-US",
  fallbackLanguage: "en-US",
  loadLocale: loadLocale,
  defaultTheme: "light",
  // Theme names live in theme/themes.ts; custom theme colours in theme/org-light.css and theme/org-dark.css.
  themes: THEMES,
  darkThemes: DARK_THEMES,
  logoUrl: "/logo-light.svg",
  logoDarkUrl: "/logo-dark.svg",
  homePath: "/",
  layout: { menuMode: "sidebar", isSidebarCollapsible: true, headerSettings: "menu", toastPosition: "top-end" },
  // AppHttp: every request gets Authorization, x-session-id and x-branch-id. Use the URLs from MsUrl above.
  // After log out the browser goes to logoutUrl (here: the app start page, which shows the login).
  http: { baseUrl: API_BASE_URL, logoutUrl: "/" },
  // Title of the branch switcher (header dropdown and settings dialog): t("branch.title").
  branchLabel: "branch.title",
};
