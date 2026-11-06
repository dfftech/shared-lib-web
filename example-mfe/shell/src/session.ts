// session.ts — sign in / out and the menu. Event based: when user info is in the session, SESSION_EVENT is fired
// and the shell loads the menu. Fired on start (session restored from sessionStorage) and after sign in;
// any MFE can fire it too: window.dispatchEvent(new CustomEvent("org:session")).

import { signal } from "@preact/signals-react";
import { AppUUID4 } from "dff-util";
import { AppHttp, authUserSignal, endSession, startSession, type MenuSource } from "shared-lib-web";
import { MsUrl } from "./config.ts";

export const SESSION_EVENT = "org:session";

/** The menu: null = loading or signed out. Passed to the provider as nav. */
export const navSignal = signal<MenuSource | null>(null);

let isLoadingNav = false;

/** GET the menu (AppHttp adds the token, x-session-id and x-branch-id). One request at a time. */
async function loadNav(): Promise<void> {
  if (isLoadingNav) {
    return;
  }
  isLoadingNav = true;
  navSignal.value = null;
  try {
    const reply = await AppHttp.Get(`${MsUrl.main}/menu-access.json`);
    navSignal.value = reply as MenuSource;
  } catch {
    navSignal.value = [];
  } finally {
    isLoadingNav = false;
  }
}

/** A session is available: load the menu. */
function handleSessionEvent(): void {
  void loadNav();
}

/** Call once at start. */
export function listenForSession(): void {
  window.addEventListener(SESSION_EVENT, handleSessionEvent);
}

/** Fires SESSION_EVENT when user info is in the session. */
export function announceSession(): void {
  if (authUserSignal.peek()) {
    const sessionEvent = new CustomEvent(SESSION_EVENT);
    window.dispatchEvent(sessionEvent);
  }
}

/** Fake sign in: any email. A real shell saves the token from its login API. */
export function signIn(email: string): void {
  const token = AppUUID4();
  startSession(token, { id: email, email: email, name: email });
  announceSession();
}

export function signOut(): void {
  endSession([], false);
  navSignal.value = null;
}
