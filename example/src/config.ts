// config.ts
// The static shell setup: app key, service URLs (MsUrl), default language + locale loader, themes, logos, layout, http.
// No router: the current page is the ?page query parameter (see app.tsx).
// Backend data as signals (backend/backend-signals.ts, filled by backend/backend.service.ts):
//   loadSupportLanguages = langSignal    (on start)
//   loadBranches         = branchSignal  (after sign in)
//   loadMenuNavigation   = navSignal     (after sign in, after the branches)

import { loadLocaleGroups, readEnvData, toAbsoluteUrl, type CustomThemesModule, type UiConfig } from 'shared-lib-web';
import { branchSignal, langSignal, navSignal } from './backend/backend-signals.ts';

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

/**
 * The texts: locales/<code>/<group>.json (the file name is the group: nav.json -> t("nav.users"); root.json = top
 * level). import.meta.glob is lazy: only the files of the language in use are downloaded, when it is used.
 */
const localeFiles = import.meta.glob("./locales/*/*.json");

// async function loadLocale(languageCode: string): Promise<LocaleMessages> {
//   const localMessages = await loadLocaleGroups(localeFiles, languageCode);
//   try {
//     const reply = await AppHttp.Get(`${MsUrl.main}/locales/${languageCode}`);
//     const apiMessages = reply as LocaleMessages;
//     return { ...localMessages, ...apiMessages }; // the API wins per group
//   } catch {
//     return localMessages; // API down: the app still has its texts
//   }
// }

/** The custom org themes (theme/org-themes.json), loaded lazily like the locale files. */
function loadThemes(): Promise<CustomThemesModule> {
  return import("./theme/org-themes.json");
}

export const config: UiConfig = {
  appNameKey: APP_NAME_KEY,
  // Label: t("app.name") from the locale files.
  appName: 'app.name',
  // No defaultLanguage: the first visit uses the browser / system language (when listed), else en-US.
  loadLocale: loadLocaleGroups.bind(null, localeFiles),
  // Themes: the custom org themes (loadThemes -> theme/org-themes.json, listed first) + all 35 DaisyUI themes.
  loadThemes: loadThemes,
  logoUrl: '/logo-light.svg',
  logoDarkUrl: '/logo-dark.svg',
  homePath: '/',
  layout: { menuMode: 'sidebar', isSidebarCollapsible: true, headerSettings: 'menu', toastPosition: 'top-end' },
  // AppHttp: every request gets Authorization, x-session-id and x-branch-id. Use the URLs from MsUrl above.
  // After log out the browser goes to logoutUrl (here: the app start page, which shows the login).
  http: { baseUrl: API_BASE_URL, logoutUrl: '/' },
  // The backend data as signals: every new value is shown at once (null = not here yet).
  loadSupportLanguages: langSignal,
  loadBranches: branchSignal,
  loadMenuNavigation: navSignal,
  // Title of the branch switcher (header dropdown and settings dialog): t("branch.title").
  branchLabel: 'branch.title',
};
