// menu-util.ts
// Turns backend menus (MenuAccessType) into NavItem[] for the sidebar and mega menu.
//
//   const navItems = toNavigation(menuResponse);   // { data: [...], meta } or the plain list
//   setNavigation(navItems);
//
// Usually you do not call this yourself: <SharedWebUiProvider nav={menuResponse}> or setMenu(menuResponse) do it.
//
// What it does:
//   - accepts the full reply { data, meta } or only the list
//   - moves the children of the "Root" group (for example ADMIN_ROOT) to the top level
//   - sorts by priority (same priority keeps the backend order), removes active: false
//   - icon names like "layout-dashboard" or "User-Round-Key" become lucide names
//   - flat flags read/create/update/delete become permissions (read: false hides the item)

import { ConstValue } from "dff-util";
import type { MenuAccessType, MenuOptions, MenuSource } from "../interfaces/app-types.ts";
import type { NavItem, ScreenPermissions } from "../interfaces/ui-config.ts";
import { resolveLucideIcon } from "./lucide-icon.ts";

/** Reads permissions from the object style or the flat flag style. */
export function readMenuPermissions(menu: MenuAccessType): ScreenPermissions {
  const permissions = menu.permissions;
  return {
    read: permissions?.read ?? menu.read ?? true,
    create: permissions?.create ?? menu.create ?? true,
    update: permissions?.update ?? menu.update ?? true,
    delete: permissions?.delete ?? menu.delete ?? true,
  };
}

/** Sort compare: lower priority first. Menus with the same priority keep the backend order. */
export function compareMenuPriority(first: MenuAccessType, second: MenuAccessType): number {
  const firstPriority = first.priority ?? Number.MAX_SAFE_INTEGER;
  const secondPriority = second.priority ?? Number.MAX_SAFE_INTEGER;
  return firstPriority - secondPriority;
}

/** Id ending used by backend container groups, for example "ADMIN_ROOT". */
export const ROOT_MENU_ID_SUFFIX = "_ROOT";

/** Name used by backend container groups. */
export const ROOT_MENU_NAME = "root";

/** Returns the active menus sorted by priority (a new list, the input is not changed). */
export function sortActiveMenus(menus: MenuAccessType[]): MenuAccessType[] {
  const activeMenus: MenuAccessType[] = [];
  for (const menu of menus) {
    if (menu.active !== false) {
      activeMenus.push(menu);
    }
  }
  activeMenus.sort(compareMenuPriority);
  return activeMenus;
}

/** Converts one backend menu (and its children) into a NavItem. */
export function toNavItem(menu: MenuAccessType): NavItem {
  const itemId = menu.id ?? menu.menuId ?? menu.href ?? menu.name;
  const permissions = readMenuPermissions(menu);
  const childMenus = menu.children ?? [];
  const children = toNavItems(childMenus);
  const navItem: NavItem = {
    id: itemId,
    labelKey: menu.name,
    labelLang: menu.nameLang,
    descriptionKey: menu.description,
    path: menu.href || undefined,
    icon: menu.icon ? resolveLucideIcon(menu.icon) : undefined,
    permissions: permissions,
  };
  if (children.length > 0) {
    navItem.children = children;
  }
  return navItem;
}

/** Converts backend menus into NavItem[]: inactive menus removed, sorted by priority. */
export function toNavItems(menus: MenuAccessType[]): NavItem[] {
  const activeMenus = sortActiveMenus(menus);
  const navItems: NavItem[] = [];
  for (const menu of activeMenus) {
    const navItem = toNavItem(menu);
    navItems.push(navItem);
  }
  return navItems;
}

/**
 * Some backends wrap all menus in one container menu (for example id "ADMIN_ROOT").
 * Returns the children of that container, or the menus unchanged when it is not there.
 */
export function unwrapRootMenu(menus: MenuAccessType[], rootMenuId: string): MenuAccessType[] {
  for (const menu of menus) {
    const menuId = menu.id ?? menu.menuId;
    if (menuId === rootMenuId) {
      return menu.children ?? [];
    }
  }
  return menus;
}

/** Reads the menu list from the backend reply ({ data: [...] }) or returns the list itself. */
export function readMenuRows(source: MenuSource | null | undefined): MenuAccessType[] {
  if (!source) {
    return [];
  }
  const isList = Array.isArray(source);
  if (isList) {
    return source;
  }
  return source.data ?? [];
}

/** true when the menu is a container group whose children belong at the top level. */
export function isRootMenu(menu: MenuAccessType, options: MenuOptions = {}): boolean {
  const menuId = menu.id ?? menu.menuId ?? ConstValue.EMPTY;
  const rootMenuIds = options.rootMenuIds;
  if (rootMenuIds) {
    return rootMenuIds.includes(menuId);
  }
  const menuName = menu.name ?? ConstValue.EMPTY;
  const lowerName = menuName.toLowerCase();
  const isNamedRoot = lowerName === ROOT_MENU_NAME;
  const hasRootId = menuId.endsWith(ROOT_MENU_ID_SUFFIX);
  return isNamedRoot || hasRootId;
}

/**
 * Replaces root groups by their children, in the place of the group.
 * [Root(Dashboard, Products), Administrator, Settings] -> [Dashboard, Products, Administrator, Settings]
 */
export function flattenRootMenus(menus: MenuAccessType[], options: MenuOptions = {}): MenuAccessType[] {
  const sortedMenus = sortActiveMenus(menus);
  const isFlattened = options.isRootFlattened ?? true;
  if (!isFlattened) {
    return sortedMenus;
  }
  const flatMenus: MenuAccessType[] = [];
  for (const menu of sortedMenus) {
    const isRoot = isRootMenu(menu, options);
    if (!isRoot) {
      flatMenus.push(menu);
      continue;
    }
    const rootChildren = menu.children ?? [];
    const sortedChildren = sortActiveMenus(rootChildren);
    for (const childMenu of sortedChildren) {
      flatMenus.push(childMenu);
    }
  }
  return flatMenus;
}

/** Converts a backend menu reply (or list) into the navigation items the shell shows. */
export function toNavigation(source: MenuSource | null | undefined, options: MenuOptions = {}): NavItem[] {
  const menuRows = readMenuRows(source);
  const flatMenus = flattenRootMenus(menuRows, options);
  const navItems: NavItem[] = [];
  for (const menu of flatMenus) {
    const navItem = toNavItem(menu);
    navItems.push(navItem);
  }
  return navItems;
}
