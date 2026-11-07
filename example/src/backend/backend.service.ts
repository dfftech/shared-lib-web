// backend.service.ts
// Fills the backend signals (backend-signals.ts) through AppHttp:
//   on start              -> langSignal
//   signed in (or restored after a refresh) -> branchSignal, then navSignal (the menu request sends x-branch-id)
//   signed out            -> branchSignal and navSignal back to null
// The provider shows every new value at once. The "backend" of the example is static files in public/api/org-api.
import { effect } from "@preact/signals-react";
import { AppHttp, isAuthenticatedSignal, readJwtToken, type BranchSource, type LangSource, type MenuSource } from "shared-lib-web";
import { MsUrl } from "../config.ts";
import { branchSignal, langSignal, navSignal } from "./backend-signals.ts";

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
    langSignal.value = reply as LangSource;
  } catch {
    langSignal.value = null;
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
  return effect(followSession);
}
