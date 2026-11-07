// config.ts — basic example: ONE language (en-US), NO branches.
// The static shell setup: app key, service URLs (MsUrl), the one language + its texts, themes, logos, layout, http.
// No router: the current page is the ?page query parameter (see app.tsx).
// Backend data as signals (backend/backend-signals.ts): loadSupportLanguages = langSignal (one language: no switcher),
// loadMenuNavigation = navSignal (after sign in). No branches.

import { loadLocaleGroups, readEnvData, toAbsoluteUrl, type CustomThemesModule, type UiConfig } from "shared-lib-web";
import { langSignal, navSignal } from "./backend/backend-signals.ts";

/** Key / base name (ENV_BASE_NAME): AppStorage keys ORG-TOKEN, ORG-LANG ...; window.env REACT_APP_ORG_... */
const APP_NAME_KEY = "ORG";

/** Service name prefix: "ORG" -> "org" -> /org-api, /org-sor ... */
const APP_API_KEY = APP_NAME_KEY.toLowerCase();

/** window.env.REACT_APP_ORG_API_BASE_URL (public/env.js), else "/api" on this site. */
const envBaseUrl = readEnvData(APP_NAME_KEY, "API_BASE_URL");
const API_BASE_URL = toAbsoluteUrl(envBaseUrl ?? "/api");

/**
 * Service paths of this project. They are paths: AppHttp adds the base URL (http.baseUrl / window.env API_BASE_URL),
 * so MsUrl.main + "/menu-access.json" -> https://<site>/api/org-api/menu-access.json.
 */
export const MsUrl = {
  api: `/${APP_API_KEY}-api`,
  main: `/${APP_API_KEY}-api`,
  sor: `/${APP_API_KEY}-sor`,
  events: `/${APP_API_KEY}-events`,
  tms: `/${APP_API_KEY}-tms`,
  utils: `/${APP_API_KEY}-util`,
};

/** The texts of the one language: locales/en-US/<group>.json (file name = group; root.json = top level). */
const localeFiles = import.meta.glob("./locales/*/*.json");

/** The custom org themes (theme/org-themes.json), loaded lazily like the locale files. */
function loadThemes(): Promise<CustomThemesModule> {
  return import("./theme/org-themes.json");
}

export const config: UiConfig = {
  appNameKey: APP_NAME_KEY,
  // Label: t("app.name") from the locale files.
  appName: "app.name",
  // One language: no languages list and no lang input, so no language switcher is shown.
  defaultLanguage: "en-US",
  loadLocale: loadLocaleGroups.bind(null, localeFiles),
  // Themes: the custom org themes (loadThemes -> theme/org-themes.json, listed first) + all 35 DaisyUI themes.
  loadThemes: loadThemes,
  logoUrl: "/logo-light.svg",
  logoDarkUrl: "/logo-dark.svg",
  homePath: "/",
  layout: { menuMode: "sidebar", isSidebarCollapsible: true, headerSettings: "menu", toastPosition: "top-end" },
  // AppHttp: every request gets Authorization and x-session-id (x-branch-id is "": no branches here). Use MsUrl above.
  // After log out the browser goes to logoutUrl (here: the app start page, which shows the login).
  http: { baseUrl: API_BASE_URL, logoutUrl: "/" },
  // The menu of the signed-in user (the "backend" of the example is public/api/org-api/menu-access.json).
  loadMenuNavigation: navSignal,
  // The languages as a signal (public/api/org-api/languages.json: only en-US, so no language switcher).
  loadSupportLanguages: langSignal,
};
