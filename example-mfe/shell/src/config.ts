// config.ts — the shell config: the shared MFE config (same appNameKey, languages, themes) + the app shell parts.
// The menu is NOT here: it is loaded from the backend after a session event (session/session.service.ts).
import { toAbsoluteUrl, type UiConfig } from "shared-lib-web";
import { config as sharedConfig } from "../../shared/config.ts";

/** API of the shell ("/api" on this site; the fake backend is public/api). */
export const API_BASE_URL = toAbsoluteUrl("/api");

/** Service URLs of the shell. */
export const MsUrl = {
  main: `${API_BASE_URL}/app-api`,
};

export const shellConfig: UiConfig = {
  ...sharedConfig,
  homePath: "/",
  logoUrl: "/logo-light.svg",
  logoDarkUrl: "/logo-dark.svg",
  // The shell owns the header (settings dialog for language / theme, user menu) and the side menu.
  // pageMode "path": pages are real paths — /settings, /forms, /profile (not ?page=settings).
  layout: { pageMode: "path", menuMode: "sidebar", isSidebarCollapsible: true, headerSettings: "menu", toastPosition: "top-end" },
  http: { baseUrl: API_BASE_URL, logoutUrl: "/" },
};
