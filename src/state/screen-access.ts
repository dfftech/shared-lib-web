// screen-access.ts
// What the user may do on the current screen, from NavItem.permissions in the navigation.
//
//   const access = screenAccessSignal.value;   // { read, create, update, delete }
//   if (canAccess("update")) { ... }
//   <RequireAccess><UserPage /></RequireAccess>   // shows PermissionDenied when read is false

import { computed } from "@preact/signals-react";
import type { NavItem, ScreenPermissions } from "../interfaces/ui-config.ts";
import { isPathMatch } from "../layouts/navigation.ts";
import { navigationSignal, currentPageSignal } from "./signals.ts";

export type ScreenAction = keyof ScreenPermissions;

/** Full access, used for screens that are not in the navigation. */
export const FULL_ACCESS: Required<ScreenPermissions> = { read: true, create: true, update: true, delete: true };

/** Finds the deepest nav item whose path matches the URL path. */
export function findNavItemByPath(items: NavItem[], currentPage: string): NavItem | undefined {
  for (const item of items) {
    const childItems = item.children ?? [];
    const childMatch = findNavItemByPath(childItems, currentPage);
    if (childMatch) {
      return childMatch;
    }
    const isMatch = isPathMatch(item.path, currentPage);
    if (isMatch) {
      return item;
    }
  }
  return undefined;
}

/** Turns optional permissions into a full object (missing values are true). */
export function completePermissions(permissions: ScreenPermissions | undefined): Required<ScreenPermissions> {
  if (!permissions) {
    return FULL_ACCESS;
  }
  return {
    read: permissions.read ?? true,
    create: permissions.create ?? true,
    update: permissions.update ?? true,
    delete: permissions.delete ?? true,
  };
}

function readScreenAccess(): Required<ScreenPermissions> {
  const items = navigationSignal.value;
  const currentPage = currentPageSignal.value;
  const navItem = findNavItemByPath(items, currentPage);
  const permissions = completePermissions(navItem?.permissions);
  return permissions;
}

/** Permissions of the current screen. */
export const screenAccessSignal = computed(readScreenAccess);

/** true when the user may do the action on the current screen. */
export function canAccess(action: ScreenAction): boolean {
  const access = screenAccessSignal.value;
  return access[action];
}

/** true when the user may do the action on any path (not only the current screen). */
export function canAccessPath(action: ScreenAction, currentPage: string): boolean {
  const items = navigationSignal.value;
  const navItem = findNavItemByPath(items, currentPage);
  const permissions = completePermissions(navItem?.permissions);
  return permissions[action];
}
