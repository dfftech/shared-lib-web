// mfe.ts — EVERYTHING about microfrontends in the shell, in one file.
//
// 1. env.mfe.js (public/) sets window.envMfe = [{ id, path, url, render }, ...]
// 2. registerMfes() tells single-spa about each entry:
//      it is active when the user is signed in and the address is its path, /forms (no path = a widget, always on);
//      the auth MFE (isAuth: true) is active while nobody is signed in — the shell has no login of its own
//      its code is imported from its url the first time
//      it mounts into the element with id = render
// 3. shell.tsx puts the MFE place into its layout with <div ref={attachMfeBody} /> and calls syncMfes() after it
//    is on screen (and again after sign in / sign out).

import { signal } from "@preact/signals-react";
import { isAuthenticatedSignal, readPageFromLocation } from "shared-lib-web";
import {
  addErrorHandler,
  getAppStatus,
  registerApplication,
  start,
  triggerAppChange,
  type AppError,
  type LifeCycles,
} from "single-spa";

/** One entry of env.mfe.js. */
export interface MfeRoute {
  id: string; // single-spa name
  isAuth?: boolean; // true = the auth MFE: shown while nobody is signed in, whatever the address; path = signed-out address
  path?: string; // page that shows it ("/forms" = ?page=forms); missing = widget, always on
  url: string; // the MFE build (exports bootstrap / mount / unmount)
  render: string; // id of the fixed slot in the shell layout
}

let isStarted = false;

/**
 * The place where page MFEs render (render: "mfe-body"). ONE element for the whole session: when the user switches
 * between AppLayout and AsideLayout, React builds a new layout, and this element (with the MFE inside) just moves
 * into it — the open MFE keeps running instead of disappearing.
 */
const mfeBodyElement = document.createElement("div");
mfeBodyElement.id = "mfe-body";

/** ref of the layout's placeholder: moves #mfe-body into it. */
export function attachMfeBody(placeholder: HTMLDivElement | null): void {
  if (placeholder) {
    placeholder.append(mfeBodyElement);
  }
}

/** The MFE that could not load (shown by shell.tsx in place of the page), or null. */
export const mfeErrorSignal = signal<{ id: string; message: string } | null>(null);

/** An MFE failed (most often: its server is not running, so its url can not be fetched). */
function handleMfeError(error: AppError): void {
  mfeErrorSignal.value = { id: error.appOrParcelName, message: error.message };
}

/** After every route change: clear the error once that MFE is on screen (it is retried on the next click). */
function clearMfeErrorWhenMounted(): void {
  const mfeError = mfeErrorSignal.peek();
  if (mfeError && getAppStatus(mfeError.id) === "MOUNTED") {
    mfeErrorSignal.value = null;
  }
}

/** The entries of env.mfe.js. */
export function readMfeRoutes(): MfeRoute[] {
  const windowWithMfe = window as Window & { envMfe?: MfeRoute[] };
  return windowWithMfe.envMfe ?? [];
}

/** The auth MFE (isAuth: true in env.mfe.js): the login, shown while nobody is signed in. */
export function findAuthRoute(): MfeRoute | undefined {
  const routes = readMfeRoutes();
  for (const route of routes) {
    if (route.isAuth) {
      return route;
    }
  }
  return undefined;
}

/** The page MFE of a page (never the auth MFE: it is only for signed-out users), or undefined. */
export function findMfeRoute(page: string): MfeRoute | undefined {
  const routes = readMfeRoutes();
  for (const route of routes) {
    if (route.path === page && !route.isAuth) {
      return route;
    }
  }
  return undefined;
}

/** How often each URL was requested (a failed import is cached by the browser, so a retry needs a new URL). */
const loadAttempts = new Map<string, number>();

/** single-spa "app": imports the MFE from its URL (on a retry with ?retry=N, e.g. after its server was started). */
function loadMfe(url: string): Promise<LifeCycles> {
  const attempt = loadAttempts.get(url) ?? 0;
  loadAttempts.set(url, attempt + 1);
  const moduleUrl = attempt === 0 ? url : `${url}?retry=${attempt}`;
  return import(/* @vite-ignore */ moduleUrl);
}

/** single-spa "activeWhen" of the auth MFE: while nobody is signed in. */
function isAuthMfeActive(): boolean {
  return !isAuthenticatedSignal.peek();
}

/** single-spa "activeWhen": signed in, and the page (/forms) is the MFE's path ("" = always). */
function isMfeActive(path: string, location: Location): boolean {
  if (!isAuthenticatedSignal.peek()) {
    return false;
  }
  if (!path) {
    return true;
  }
  const page = readPageFromLocation(location);
  return page === path;
}

/** First call: registers every entry and starts single-spa. Later calls: re-check which MFE is active. */
export function syncMfes(): void {
  if (isStarted) {
    void triggerAppChange();
    return;
  }
  isStarted = true;
  addErrorHandler(handleMfeError);
  window.addEventListener("single-spa:routing-event", clearMfeErrorWhenMounted);
  const routes = readMfeRoutes();
  for (const route of routes) {
    const app = loadMfe.bind(null, route.url);
    const routePath = route.path ?? "";
    const activeWhen = route.isAuth ? isAuthMfeActive : isMfeActive.bind(null, routePath);
    const customProps = { domElementId: route.render };
    registerApplication({ name: route.id, app: app, activeWhen: activeWhen, customProps: customProps });
  }
  start();
}
