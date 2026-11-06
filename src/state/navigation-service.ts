// navigation-service.ts
// Navigation state: menu items, navigation mode, collapsed rail and mega menu.
// The current page is the ?page query parameter (see query/query-param.ts).
//
//   setNavigation(menusFromApi);      // replace the config menus at runtime (role based menus)
//   setNavigationLoading(true);       // sidebar shows a skeleton
//   changeNavigationMode("megamenu"); // switch layout, saved to localStorage

import type { MouseEvent } from "react";
import { ConstValue } from "dff-util";
import type { NavItem, NavigationMode, UiConfig } from "../interfaces/ui-config.ts";
import {
  isMenuVisibleSignal,
  isSidebarCollapsedSignal,
  isSidebarOpenSignal,
  navigationLoadingSignal,
  navigationModeSignal,
  navigationSignal,
  openMegaMenuIdSignal,
  railFlyoutSignal,
} from "./signals.ts";
import { AppStorage } from "../utils/app-storage.ts";
import { MENU_MODE, SIDEBAR_COLLAPSED } from "../utils/storage-keys.ts";

/** Replaces the navigation items, for example with menus loaded from the backend. */
export function setNavigation(items: NavItem[]): void {
  navigationSignal.value = items;
}

/** Shows or hides the menu skeleton while menus load. */
export function setNavigationLoading(isLoading: boolean): void {
  navigationLoadingSignal.value = isLoading;
}

/** true when the user may see this item (permissions.read is not false). */
export function isNavItemVisible(item: NavItem): boolean {
  const canRead = item.permissions?.read ?? true;
  return canRead;
}

/** Returns only the items the user may read, also inside groups. Empty groups are removed. */
export function filterVisibleNavigation(items: NavItem[]): NavItem[] {
  const visibleItems: NavItem[] = [];
  for (const item of items) {
    const isVisible = isNavItemVisible(item);
    if (!isVisible) {
      continue;
    }
    if (!item.children) {
      visibleItems.push(item);
      continue;
    }
    const visibleChildren = filterVisibleNavigation(item.children);
    if (visibleChildren.length === 0 && !item.path) {
      continue;
    }
    const visibleGroup: NavItem = { ...item, children: visibleChildren };
    visibleItems.push(visibleGroup);
  }
  return visibleItems;
}

/** Switches between "sidebar" and "megamenu" and remembers the choice. */
export function changeNavigationMode(mode: NavigationMode): void {
  navigationModeSignal.value = mode;
  closeMegaMenu();
  closeRailFlyout();
  AppStorage.setData(MENU_MODE, mode);
}

/** Collapses or expands the desktop sidebar rail and remembers it. */
export function toggleSidebarCollapsed(): void {
  const isCollapsed = isSidebarCollapsedSignal.value;
  const nextValue = !isCollapsed;
  isSidebarCollapsedSignal.value = nextValue;
  closeRailFlyout();
  const storedValue = String(nextValue);
  AppStorage.setData(SIDEBAR_COLLAPSED, storedValue);
}

/** Reads the saved navigation mode, or the config value. */
export function readInitialNavigationMode(config: UiConfig): NavigationMode {
  const storedMode = AppStorage.getText(MENU_MODE);
  if (storedMode === "sidebar" || storedMode === "megamenu") {
    return storedMode;
  }
  return config.layout?.menuMode ?? "sidebar";
}

/** Sets navigation items, mode and collapsed state from the config and localStorage. */
export function initializeNavigation(config: UiConfig): void {
  navigationSignal.value = config.navigation ?? [];
  navigationModeSignal.value = readInitialNavigationMode(config);
  const storedCollapsed = AppStorage.getText(SIDEBAR_COLLAPSED);
  const isCollapsible = config.layout?.isSidebarCollapsible ?? true;
  isSidebarCollapsedSignal.value = isCollapsible && storedCollapsed === ConstValue.TRUE;
  isMenuVisibleSignal.value = config.layout?.showMenu ?? true;
}

// ---- Menu on / off ----

/**
 * Shows or hides the whole menu at runtime (sidebar + rail, or the mega menu bar, and the menu buttons):
 *   setMenuVisible(false);   // for example a full-screen page, a kiosk view or a user without menu rights
 *   setMenuVisible(true);
 */
export function setMenuVisible(isVisible: boolean): void {
  isMenuVisibleSignal.value = isVisible;
  if (!isVisible) {
    closeAllMenus();
  }
}

/** Switches the menu on / off. */
export function toggleMenuVisible(): void {
  const isVisible = isMenuVisibleSignal.value;
  setMenuVisible(!isVisible);
}

// ---- Mega menu ----

/** Opens the mega menu group stored in data-menu-id, or closes it when it is already open. */
export function handleMegaMenuTriggerClick(event: MouseEvent<HTMLElement>): void {
  const trigger = event.currentTarget;
  const menuId = trigger.dataset.menuId ?? ConstValue.EMPTY;
  const isAlreadyOpen = openMegaMenuIdSignal.value === menuId;
  openMegaMenuIdSignal.value = isAlreadyOpen ? ConstValue.EMPTY : menuId;
}

/** Closes the mega menu. */
export function closeMegaMenu(): void {
  openMegaMenuIdSignal.value = ConstValue.EMPTY;
}

// ---- Collapsed rail flyout ----

/** Opens the flyout of the rail group stored in data-menu-id, next to the clicked button. */
export function handleRailGroupClick(event: MouseEvent<HTMLElement>): void {
  const button = event.currentTarget;
  const groupId = button.dataset.menuId ?? ConstValue.EMPTY;
  const isAlreadyOpen = railFlyoutSignal.value.groupId === groupId;
  if (isAlreadyOpen) {
    closeRailFlyout();
    return;
  }
  const buttonRect = button.getBoundingClientRect();
  railFlyoutSignal.value = { groupId: groupId, top: buttonRect.top };
}

/** Closes the rail flyout. */
export function closeRailFlyout(): void {
  railFlyoutSignal.value = { groupId: ConstValue.EMPTY, top: 0 };
}

/** Closes every open menu: drawer, mega menu and rail flyout. Used after a link click. */
export function closeAllMenus(): void {
  isSidebarOpenSignal.value = false;
  closeMegaMenu();
  closeRailFlyout();
}
