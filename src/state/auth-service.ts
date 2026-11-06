// auth-service.ts
// Signed-in user and access token, shared by AppHttp and the app.
//
//   startSession(token, user);              // after login (token saved in AppStorage, sessionStorage)
//   startSession(token, user, true);        // also saves REMEMBER_ME = true (localStorage); the token stays in sessionStorage
//   isAuthenticatedSignal.value             // true / false
//   endSession();                           // log out (LANG, THEME ... are kept)
//   endSession([BRANCH_ID]);                // log out, also keeps the listed AppStorage keys

import { computed, signal } from "@preact/signals-react";
import { ConstValue } from "dff-util";
import type { AuthUser } from "../interfaces/app-types.ts";
import { AppStorage } from "../utils/app-storage.ts";
import { resetSessionId } from "../utils/session-id.ts";
import { AUTH_USER, BRANCH_ID, REMEMBER_ME, TOKEN } from "../utils/storage-keys.ts";
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
  sessionTokenSignal.value = token;
  authUserSignal.value = user;
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
  sessionTokenSignal.value = token;
  authUserSignal.value = storedUser && typeof storedUser === "object" ? (storedUser as AuthUser) : null;
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
  if (isRedirect) {
    redirectToLogoutUrl();
  }
}
