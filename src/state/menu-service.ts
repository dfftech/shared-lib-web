// menu-service.ts
// Menus that come from the backend at runtime, separate from config.ts.
//
//   <SharedWebUiProvider config={config} nav={menuResponse}>   // reactive: a new reply replaces the menu
//   setMenu(menuResponse);                                      // or call it yourself, for example after login
//   setMenuLoading();                                           // sidebar shows a skeleton until setMenu()
//
// menuResponse is the backend reply { data: [...], meta } or only the list. Options come from config.navOptions.

import type { MenuOptions, MenuSource } from "../interfaces/app-types.ts";
import { toNavigation } from "../utils/menu-util.ts";
import { setNavigation, setNavigationLoading } from "./navigation-service.ts";
import { uiConfigSignal } from "./signals.ts";

/** The menu reply last applied by registerMenu (undefined = none yet). */
let appliedMenuSource: MenuSource | null | undefined = undefined;

/** Reads the menu options from config.navOptions. */
export function readMenuOptions(): MenuOptions {
  const config = uiConfigSignal.peek();
  return config?.navOptions ?? {};
}

/** Shows the backend menu: converts the reply into navigation items and hides the menu skeleton. */
export function setMenu(source: MenuSource, options?: MenuOptions): void {
  appliedMenuSource = source;
  const menuOptions = options ?? readMenuOptions();
  const navItems = toNavigation(source, menuOptions);
  setNavigation(navItems);
  setNavigationLoading(false);
}

/** Shows the menu skeleton until setMenu() is called. */
export function setMenuLoading(): void {
  appliedMenuSource = null;
  setNavigationLoading(true);
}

/** Removes the backend menu (for example on logout). */
export function clearMenu(): void {
  setNavigation([]);
  setNavigationLoading(false);
  appliedMenuSource = undefined;
}

/**
 * Used by <SharedWebUiProvider nav={...}>. Applies the value only when it changed.
 *   undefined     -> use config.navigation
 *   null          -> still loading: menu skeleton (typical first value before the API answers)
 *   reply / list  -> show it (a new reply object later replaces the menu)
 * Tip: on an API error pass [] (empty menu) instead of leaving null, or the skeleton stays.
 */
export function registerMenu(source: MenuSource | null | undefined): void {
  if (source === undefined || source === appliedMenuSource) {
    return;
  }
  if (source === null) {
    setMenuLoading();
    return;
  }
  setMenu(source);
}

/** Forgets the applied reply so the next registerMenu() applies it again (used when the config changes). */
export function forgetAppliedMenu(): void {
  appliedMenuSource = undefined;
}
