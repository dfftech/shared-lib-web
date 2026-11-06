// nav.service.ts
// The menu of the example. It is NOT in config.ts: it comes from the backend after login, through AppHttp.
//
//   navSignal.value = null;        // first value: the sidebar shows a skeleton
//   navSignal.value = reply;       // the API answered: the menu appears
//
// root.tsx passes it on: <SharedWebUiProvider config={config} nav={navSignal.value}>
// The "backend" of the example is a static file: public/api/app-api/menu-access.json.
import { signal } from "@preact/signals-react";
import { AppHttp, type MenuSource } from "shared-lib-web";
import { MsUrl } from "../config.ts";

/** null = loading (skeleton) or signed out; a reply = the menu to show. */
export const navSignal = signal<MenuSource | null>(null);

/** GET the menu of the signed-in user (token, x-session-id and x-branch-id are added by AppHttp). */
async function fetchNav(): Promise<MenuSource> {
  const menuUrl = `${MsUrl.main}/menu-access.json`;
  const reply = await AppHttp.Get(menuUrl);
  return reply as MenuSource;
}

/** Loads the menu: null first (skeleton), then the reply. On an error shows an empty menu. */
export async function loadNav(): Promise<void> {
  navSignal.value = null;
  try {
    const reply = await fetchNav();
    navSignal.value = reply;
  } catch {
    navSignal.value = [];
  }
}

/** Removes the menu (logout). */
export function clearNav(): void {
  navSignal.value = null;
}
