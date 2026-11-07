// backend.service.ts
// Fills the signals of backend-signals.ts:
//   texts and themes  -> localeSignal (the languages the library asks for), themesSignal (theme/org-themes.json)
//   on start              -> supportLangSignal
//   signed in (or restored after a refresh) -> branchSignal, then navSignal (the menu request sends x-branch-id)
//   signed out            -> branchSignal and navSignal back to null
// The provider shows every new value at once. The "backend" of the example is static files in public/api/org-api.
import { effect } from "@preact/signals-react";
import { AppHttp, fillLocaleBundle, loadLocaleGroups, isAuthenticatedSignal, readJwtToken, type BranchSource, type CustomThemesModule, type LangSource, type MenuSource } from "shared-lib-web";
import { MsUrl } from "../config.ts";
import { branchSignal, supportLangSignal, navSignal, localeSignal, themesSignal } from "./backend-signals.ts";

/** The texts: ../locales/<code>/<group>.json — lazy, only the languages the library asks for are loaded. */
const localeFiles = import.meta.glob("../locales/*/*.json");
const loadTexts = loadLocaleGroups.bind(null, localeFiles);

/** true once the theme file was requested (one request, also with StrictMode). */
let isThemeRequested = false;

/** Loads the custom org themes (../theme/org-themes.json) into themesSignal. */
async function loadThemeFile(): Promise<void> {
  if (isThemeRequested) {
    return;
  }
  isThemeRequested = true;
  try {
    const themeModule = await import("../theme/org-themes.json");
    themesSignal.value = themeModule as CustomThemesModule;
  } catch {
    themesSignal.value = [];
  }
}

/** Stops every follower started by startBackendData. */
function stopAll(stoppers: Array<() => void>): void {
  for (const stop of stoppers) {
    stop();
  }
}

/** The token whose branches and menu are loaded ("" = signed out); StrictMode starts things twice. */
let loadedToken: string | undefined = undefined;

/** true once the languages were requested (only one request, also with StrictMode). */
let isLanguageRequested = false;

/** GET the languages. On an error the default language stays. */
async function loadLanguages(): Promise<void> {
  if (isLanguageRequested) {
    return;
  }
  isLanguageRequested = true;
  try {
    const reply = await AppHttp.Get(`${MsUrl.main}/languages.json`);
    supportLangSignal.value = reply as LangSource;
  } catch {
    supportLangSignal.value = null;
  }
}

/** GET the branches (no switcher on an error). */
async function loadBranches(): Promise<void> {
  try {
    const reply = await AppHttp.Get(`${MsUrl.main}/branches.json`);
    branchSignal.value = reply as BranchSource;
  } catch {
    branchSignal.value = null;
  }
}

/** GET the menu: null first (skeleton), an empty menu on an error. */
async function loadNav(): Promise<void> {
  navSignal.value = null;
  try {
    const reply = await AppHttp.Get(`${MsUrl.main}/menu-access.json`);
    navSignal.value = reply as MenuSource;
  } catch {
    navSignal.value = [];
  }
}

/** After sign in: the branches first (the provider selects one), then the menu. */
async function loadSessionData(): Promise<void> {
  await loadBranches();
  await loadNav();
}

/** Signed in -> load branches and menu; signed out -> remove them. */
function followSession(): void {
  const isSignedIn = isAuthenticatedSignal.value;
  const token = isSignedIn ? readJwtToken() : "";
  if (token === loadedToken) {
    return;
  }
  loadedToken = token;
  if (isSignedIn) {
    void loadSessionData();
    return;
  }
  branchSignal.value = null;
  navSignal.value = null;
}

/** For useEffect in root.tsx (after the provider saved the config, which AppHttp reads). Returns the cleanup. */
export function startBackendData(): () => void {
  void loadLanguages();
  void loadThemeFile();
  const stopTexts = fillLocaleBundle(localeSignal, loadTexts);
  const stopSession = effect(followSession);
  return stopAll.bind(null, [stopTexts, stopSession]);
}
