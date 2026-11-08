// config.ts
// The static shell setup: app key, service URLs (MsUrl), default language + locale loader, themes, layout, http (app name and logos: company details).
// No router: the current page is the ?page query parameter (see app.tsx).
// Backend data as signals (app-init/app-init-signals.ts, filled by app-init/app-init.service.ts):
//   loadSupportLanguages = supportLangSignal    (on start)
//   loadCompanyDetails   = companySignal        (on start: app name, company name, favicon, logo)
//   loadBranches         = branchSignal  (after sign in)
//   loadMenuNavigation   = navSignal     (after sign in, after the branches)

import { readEnvData, toAbsoluteUrl, type UiConfig } from "shared-lib-web";
import { branchSignal, supportLangSignal, navSignal, localeSignal, themesSignal, companySignal } from "./app-init/app-init-signals.ts";

/** Key / base name (ENV_BASE_NAME): AppStorage keys ORG-TOKEN, ORG-LANG ...; window.env REACT_APP_ORG_... */
const APP_NAME_KEY = "ORG";

/** Service name prefix: "ORG" -> "org" -> /org-api, /org-sor ... */
const APP_API_KEY = APP_NAME_KEY.toLowerCase();

/** window.env.REACT_APP_ORG_API_BASE_URL (public/env.js), else "/api" on this site. */
const envBaseUrl = readEnvData(APP_NAME_KEY, "API_BASE_URL");
const API_BASE_URL = toAbsoluteUrl(envBaseUrl ?? "/api");

/**
 * Service paths of this project. They are paths: AppHttp adds the base URL (http.baseUrl / window.env API_BASE_URL),
 * so MsUrl.sor + "/company-details" -> https://<site>/api/org-sor/company-details.
 * Everything comes from sor: company details, languages (/load/LANG), locales and themes (/content-load),
 * menu (/authorization/<persona>), branches (/load/BRANCHS).
 */
export const MsUrl = {
  api: `/${APP_API_KEY}-api`,
  main: `/${APP_API_KEY}-api`,
  sor: `/${APP_API_KEY}-sor`,
  events: `/${APP_API_KEY}-events`,
  tms: `/${APP_API_KEY}-tms`,
  utils: `/${APP_API_KEY}-util`,
};

export const config: UiConfig = {
  appNameKey: APP_NAME_KEY,
  // No defaultLanguage: the first visit uses the browser / system language (when listed), else en-US.
  // The texts as a signal: { "en-US": {...}, ... }; the library asks for languages, the app loads them.
  loadLocale: localeSignal,
  // Themes as a signal: the custom org themes (sor /content-load?query=theme, listed first) + all 35 DaisyUI themes.
  loadThemes: themesSignal,
  homePath: "/",
  layout: { menuMode: "sidebar", isSidebarCollapsible: true, headerSettings: "menu", toastPosition: "top-end" },
  // AppHttp: every request gets Authorization, x-session-id and x-branch-id. Use the URLs from MsUrl above.
  // After log out the browser goes to logoutUrl (here: the app start page, which shows the login).
  http: { baseUrl: API_BASE_URL, logoutUrl: "/" },
  // The backend data as signals: every new value is shown at once (null = not here yet).
  loadSupportLanguages: supportLangSignal,
  // The brand comes from the company details (sor /company-details), not from this config:
  // appName (label + tab title), logoUrl / logoDarkUrl, faviconUrl; companyName is the logo alt text.
  loadCompanyDetails: companySignal,
  loadBranches: branchSignal,
  loadMenuNavigation: navSignal,
  // Title of the branch switcher (header dropdown and settings dialog): t("branch.title").
  branchLabel: "branch.title",
};
