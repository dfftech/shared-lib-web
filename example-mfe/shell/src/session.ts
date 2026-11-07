// session.ts — sign in / out and the backend data of the config signals (config.ts):
//   langSignal  the languages, loaded once on start
//   navSignal   the menu, loaded when a user is signed in (also after a refresh), null again on sign out
// startBackendData() is started once in shell.tsx (after the provider saved the config, which AppHttp reads).

import { effect } from "@preact/signals-react";
import { AppUUID4 } from "dff-util";
import {
  AppHttp,
  endSession,
  isAuthenticatedSignal,
  readJwtToken,
  startSession,
  type LangSource,
  type MenuSource,
} from "shared-lib-web";
import { MsUrl, langSignal, navSignal } from "./config.ts";

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

/** For useEffect in shell.tsx: languages now, the menu with every sign in / out. Returns the cleanup. */
export function startBackendData(): () => void {
  void loadLanguages();
  return effect(followSession);
}

/** Fake sign in: any email. A real shell saves the token from its login API. */
export function signIn(email: string): void {
  const token = AppUUID4();
  startSession(token, { id: email, email: email, name: email });
}

export function signOut(): void {
  endSession([], false);
}
