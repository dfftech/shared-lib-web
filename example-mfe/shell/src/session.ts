// session.ts — sign in / out and the data of the config signals (config.ts):
//   localeSignal the texts of the languages the library asks for (sor /content-load?query=locales.<code>: shell + MFE groups)
//   themesSignal the custom org themes (sor /content-load?query=theme), loaded once on start
//   supportLangSignal  the languages, loaded once on start
//   companySignal the company details (app name, company name, favicon, logo), loaded once on start
//   navSignal   the menu, loaded when a user is signed in (also after a refresh), null again on sign out
// startAppInit() is started once in shell.tsx (after the provider saved the config, which AppHttp reads).

import { effect } from "@preact/signals-react";
import {
  AppHttp,
  authUserSignal,
  currentPageSignal,
  endSession,
  fillLocaleBundle,
  isAuthenticatedSignal,
  openPage,
  readContent,
  readJwtToken,
  type CompanySource,
  type CustomThemesModule,
  type LangSource,
  type LocaleModule,
  type MenuSource,
} from 'shared-lib-web';
import { companySignal, localeSignal, MsUrl, navSignal, supportLangSignal, themesSignal } from './config.ts';
import { findAuthRoute } from './mfe.ts';

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

/** The signed-out page when the auth entry of env.mfe.js has no path. */
const DEFAULT_AUTH_PAGE = "/auth";

/** The query values of the auth page: ?page=login. */
const LOGIN_VALUES = { page: "login" };

/** The home page with a token: opened after sign in (when no page was asked for) and for "/" while signed in. */
export const SIGNED_IN_HOME = "/dashboard";

/** The bare address of the site. */
const ROOT_PATH = "/";

/** The page asked for while signed out (opened after sign in); "" = home. */
let pageAfterSignIn = "";

/** The last sign-in state followSignInAddress saw (undefined = not started yet). */
let lastSignedIn: boolean | undefined = undefined;

/** The page while nobody is signed in: the path of the auth MFE in env.mfe.js ("/auth"), shown as /auth?page=login. */
export function readAuthPage(): string {
  const authRoute = findAuthRoute();
  return authRoute?.path ?? DEFAULT_AUTH_PAGE;
}

/** Replaces the address (no extra history entry, so Back does not return to the auth page or a signed-out page). */
function replacePage(page: string, extraValues: Record<string, string> = {}): void {
  const options = { isReplace: true };
  openPage(page, extraValues, options);
}

/**
 * The address follows the session — without a token home is /auth?page=login, with a token home is /dashboard:
 *   signed out (log out, or a visit without a session) -> /auth?page=login; a page asked for at start is remembered
 *   signed in -> the remembered page, else /dashboard (after a log out the next user starts at /dashboard)
 */
function followSignInAddress(): void {
  const isSignedIn = isAuthenticatedSignal.value;
  if (isSignedIn === lastSignedIn) {
    return;
  }
  const isFirstRun = lastSignedIn === undefined;
  lastSignedIn = isSignedIn;
  const page = currentPageSignal.peek();
  const authPage = readAuthPage();
  if (!isSignedIn) {
    const isAuthPage = page === authPage;
    const isRootAddress = window.location.pathname === ROOT_PATH;
    const isRemembered = isFirstRun && !isAuthPage && !isRootAddress;
    pageAfterSignIn = isRemembered ? page : "";
    replacePage(authPage, LOGIN_VALUES);
    return;
  }
  if (isFirstRun && page !== authPage) {
    return;
  }
  const nextPage = pageAfterSignIn || SIGNED_IN_HOME;
  pageAfterSignIn = "";
  replacePage(nextPage);
}

/** Signed in at the bare "/" (a "Home" menu link, a bookmark): -> /dashboard. Runs on every page change. */
function followSignedInHome(): void {
  const isSignedIn = isAuthenticatedSignal.value;
  const page = currentPageSignal.value;
  const isRootAddress = window.location.pathname === ROOT_PATH;
  if (isSignedIn && isRootAddress && page) {
    replacePage(SIGNED_IN_HOME);
  }
}

/** For useEffect in shell.tsx: texts, themes and languages now, the menu with every sign in / out. Returns the cleanup. */
export function startAppInit(): () => void {
  void loadLanguages();
  void loadCompany();
  void loadThemeFile();
  const stopTexts = fillLocaleBundle(localeSignal, loadTexts);
  const stopSession = effect(followSession);
  const stopAddress = effect(followSignInAddress);
  const stopHome = effect(followSignedInHome);
  return stopAll.bind(null, [stopTexts, stopSession, stopAddress, stopHome]);
}

export function signOut(): void {
  endSession([], false);
}
