// auth-service.ts
// Signed-in user and access token, shared by AppHttp and the app.
//
//   startSession(token, user);              // after login (token saved in AppStorage, sessionStorage)
//   startSession(token, user, true);        // also saves REMEMBER_ME = true (localStorage); the token stays in sessionStorage
//   isAuthenticatedSignal.value             // true / false
//   endSession();                           // log out (LANG, THEME ... are kept)
//   endSession([BRANCH_ID]);                // log out, also keeps the listed AppStorage keys
//   refreshSessionToken(newToken);          // new token after a JWT regenerate (user stays; AppHttp calls it itself)
//
// Microfrontends: each one bundles its own copy of the library. startSession / endSession fire SESSION_EVENT, and
// every other copy (startSessionSync, started by the provider) applies it: an auth MFE signs in -> the shell is signed in.

import { computed, signal } from "@preact/signals-react";
import { ConstValue } from "dff-util";
import type { AuthUser } from "../interfaces/app-types.ts";
import { AppStorage } from "../utils/app-storage.ts";
import { resetSessionId } from "../utils/session-id.ts";
import { AUTH_USER, BRANCH_ID, REMEMBER_ME, SESSION_EVENT, TOKEN } from "../utils/storage-keys.ts";
import { clearBranch, forgetAppliedBranches, restoreBranch } from "./branch-service.ts";
import { uiConfigSignal } from "./signals.ts";

export const DEFAULT_TOKEN_KEY = TOKEN;
export const AUTH_USER_KEY = AUTH_USER;

/** The signed-in user, or null. */
export const authUserSignal = signal<AuthUser | null>(null);

/** The access token, or "". */
export const sessionTokenSignal = signal<string>(ConstValue.EMPTY);

function readIsAuthenticated(): boolean {
  const token = sessionTokenSignal.value;
  return token.length > 0;
}

/** true when a token is present. */
export const isAuthenticatedSignal = computed(readIsAuthenticated);

/** Id of this copy of the library: its own session events are not applied again. */
const randomNumber = Math.random();
const LIBRARY_COPY_ID = String(randomNumber);

/** What SESSION_EVENT carries. */
interface SessionEventDetail {
  isSignedIn?: boolean;
  isTokenRefresh?: boolean;
  copyId?: string;
}

let isSessionSyncStarted = false;

/** Tells every other library copy on the page that the session started or ended. */
function notifySessionChanged(isSignedIn: boolean, isTokenRefresh: boolean = false): void {
  if (typeof window === "undefined") {
    return;
  }
  const detail: SessionEventDetail = { isSignedIn: isSignedIn, isTokenRefresh: isTokenRefresh, copyId: LIBRARY_COPY_ID };
  const eventInit = { detail: detail };
  const sessionEvent = new CustomEvent(SESSION_EVENT, eventInit);
  window.dispatchEvent(sessionEvent);
}

/** AppStorage key of the token (config.http.tokenKey, default "TOKEN"). */
export function readTokenKey(): string {
  const config = uiConfigSignal.value;
  return config?.http?.tokenKey ?? DEFAULT_TOKEN_KEY;
}

/** Token without a "Bearer " prefix; "" when missing. */
export function readAccessToken(): string {
  const token = sessionTokenSignal.value;
  const plainToken = token.replace(/^Bearer\s+/i, ConstValue.EMPTY);
  return plainToken.trim();
}

/**
 * Saves token and user after login (sessionStorage). isRemembered only saves the REMEMBER_ME preference
 * (localStorage), for example to pre-tick the box on the login form next time.
 */
export function startSession(token: string, user: AuthUser | null, isRemembered: boolean = false): void {
  const tokenKey = readTokenKey();
  AppStorage.setData(tokenKey, token);
  AppStorage.setData(AUTH_USER_KEY, user);
  AppStorage.setData(REMEMBER_ME, isRemembered);
  // The user first: whatever runs on sign in (branches, menu) already reads the user.
  authUserSignal.value = user;
  sessionTokenSignal.value = token;
  notifySessionChanged(true);
}

/**
 * Replaces the token after a JWT regenerate: user, branch and REMEMBER_ME stay, no menu / branch reload.
 * Every other library copy on the page takes the new token too.
 */
export function refreshSessionToken(token: string): void {
  const tokenKey = readTokenKey();
  AppStorage.setData(tokenKey, token);
  sessionTokenSignal.value = token;
  notifySessionChanged(true, true);
}

/** Another library copy refreshed the token: read it from AppStorage. */
function applyRefreshedToken(): void {
  const tokenKey = readTokenKey();
  const token = AppStorage.getData(tokenKey);
  if (typeof token === "string" && token.length > 0) {
    sessionTokenSignal.value = token;
  }
}

/** Reads a saved session (sessionStorage). Called by SharedWebUiProvider. */
export function restoreSession(): void {
  restoreBranch();
  const tokenKey = readTokenKey();
  const token = AppStorage.getData(tokenKey);
  if (typeof token !== "string" || token.length === 0) {
    return;
  }
  const storedUser = AppStorage.getData(AUTH_USER_KEY);
  authUserSignal.value = storedUser && typeof storedUser === "object" ? (storedUser as AuthUser) : null;
  sessionTokenSignal.value = token;
}

/** Sends the browser to config.http.logoutUrl (replace: Back does not return to the signed-in page). */
export function redirectToLogoutUrl(): void {
  const config = uiConfigSignal.peek();
  const logoutUrl = config?.http?.logoutUrl;
  const hasWindow = typeof window !== "undefined";
  if (!logoutUrl || !hasWindow) {
    return;
  }
  window.location.replace(logoutUrl);
}

/**
 * Logs out: clears token, user and app storage (except keepKeys), starts a new session id
 * and goes to config.http.logoutUrl when it is set (isRedirect = false stays on the page).
 */
export function endSession(keepKeys: string[] = [], isRedirect: boolean = true): void {
  AppStorage.clearData(keepKeys);
  const isBranchKept = keepKeys.includes(BRANCH_ID);
  if (!isBranchKept) {
    clearBranch();
  }
  // The next sign-in selects a branch again, even when the app passes the same branch list.
  forgetAppliedBranches();
  sessionTokenSignal.value = ConstValue.EMPTY;
  authUserSignal.value = null;
  resetSessionId();
  notifySessionChanged(false);
  if (isRedirect) {
    redirectToLogoutUrl();
  }
}

/** Another library copy started or ended the session: read it from AppStorage (sign in) or clear it here (sign out). */
export function handleSessionEvent(event: Event): void {
  const detail = (event as CustomEvent<SessionEventDetail>).detail;
  const isOwnEvent = detail?.copyId === LIBRARY_COPY_ID;
  if (!detail || isOwnEvent) {
    return;
  }
  if (detail.isTokenRefresh) {
    applyRefreshedToken();
    return;
  }
  if (detail.isSignedIn) {
    restoreSession();
    return;
  }
  forgetAppliedBranches();
  sessionTokenSignal.value = ConstValue.EMPTY;
  authUserSignal.value = null;
}

/** Starts following the session events of the other library copies (once; called by SharedWebUiProvider). */
export function startSessionSync(): void {
  const hasWindow = typeof window !== "undefined";
  if (!hasWindow || isSessionSyncStarted) {
    return;
  }
  isSessionSyncStarted = true;
  window.addEventListener(SESSION_EVENT, handleSessionEvent);
}
