// backend.service.ts
// Fills the backend signals (backend-signals.ts) through AppHttp:
//   on start  -> langSignal (public/api/org-api/languages.json)
//   signed in (or restored after a refresh) -> navSignal (public/api/org-api/menu-access.json); signed out -> null
import { effect } from "@preact/signals-react";
import { AppHttp, isAuthenticatedSignal, readJwtToken, type LangSource, type MenuSource } from "shared-lib-web";
import { MsUrl } from "../config.ts";
import { langSignal, navSignal } from "./backend-signals.ts";

/** The token whose menu is loaded ("" = signed out); StrictMode starts things twice. */
let loadedToken: string | undefined = undefined;

/** true once the languages were requested (one request, also with StrictMode). */
let isLanguageRequested = false;

/** GET the languages once. On an error the default language stays. */
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
export function startBackendData(): () => void {
  void loadLanguages();
  return effect(followSession);
}
