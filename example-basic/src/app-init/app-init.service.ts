// app-init.service.ts
// Fills the signals of app-init-signals.ts:
//   texts and themes  -> localeSignal (the languages the library asks for: sor /content-load?query=locales.<code>), themesSignal (sor /content-load?query=theme)
//   on start  -> supportLangSignal (sor /load/LANG?active=true), companySignal (sor /company-details)
//   signed in (or restored after a refresh) -> navSignal (util /authorization/<persona>?roles=<roles>); signed out -> null
import { effect } from "@preact/signals-react";
import { AppHttp, authUserSignal, readContent, fillLocaleBundle, isAuthenticatedSignal, readJwtToken, type CompanySource, type CustomThemesModule, type LangSource, type LocaleModule, type MenuSource } from "shared-lib-web";
import { MsUrl } from "../config.ts";
import { supportLangSignal, navSignal, localeSignal, themesSignal, companySignal } from "./app-init-signals.ts";

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

/** Stops every follower started by startAppInit. */
function stopAll(stoppers: Array<() => void>): void {
  for (const stop of stoppers) {
    stop();
  }
}

/** The token whose menu is loaded ("" = signed out); StrictMode starts things twice. */
let loadedToken: string | undefined = undefined;

/** true once the company details were requested (one request, also with StrictMode). */
let isCompanyRequested = false;

/** GET the company details once (app name, company name, favicon, logos). On an error: {} (the app key is shown). */
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

/** GET the languages once. On an error the default language stays. */
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

/** Persona and roles of the menu request when the signed-in user has none. */
const DEFAULT_PERSONA = "admin";
const DEFAULT_ROLES = ["ADMIN_ADMIN"];

/** GET the menu: null first (skeleton), an empty menu on an error. */
async function loadNav(): Promise<void> {
  navSignal.value = null;
  try {
    const user = authUserSignal.peek();
    const persona = user?.persona ?? DEFAULT_PERSONA;
    const roles = user?.roles ?? DEFAULT_ROLES;
    const roleText = roles.join(",");
    const reply = await AppHttp.Get(`${MsUrl.utils}/authorization/${persona}`, { roles: roleText });
    navSignal.value = reply as MenuSource;
  } catch {
    navSignal.value = [];
  }
}

/** Signed in -> load the menu; signed out -> remove it. */
function followSession(): void {
  const isSignedIn = isAuthenticatedSignal.value;
  const token = isSignedIn ? readJwtToken() : "";
  if (token === loadedToken) {
    return;
  }
  loadedToken = token;
  if (isSignedIn) {
    void loadNav();
    return;
  }
  navSignal.value = null;
}

/** For useEffect in root.tsx (after the provider saved the config, which AppHttp reads). Returns the cleanup. */
export function startAppInit(): () => void {
  void loadLanguages();
  void loadCompany();
  void loadThemeFile();
  const stopTexts = fillLocaleBundle(localeSignal, loadTexts);
  const stopSession = effect(followSession);
  return stopAll.bind(null, [stopTexts, stopSession]);
}
