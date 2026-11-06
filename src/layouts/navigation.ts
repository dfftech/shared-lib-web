// navigation.ts
// Helpers to work with the config navigation tree.

import type { NavItem } from "../interfaces/ui-config.ts";

/** true when a nav path matches the current URL path (or is a parent of it). */
export function isPathMatch(navPath: string | undefined, pathname: string): boolean {
  if (!navPath) {
    return false;
  }
  if (navPath === pathname) {
    return true;
  }
  if (navPath === "/") {
    return false;
  }
  const parentPrefix = `${navPath}/`;
  const isChildPath = pathname.startsWith(parentPrefix);
  return isChildPath;
}

/**
 * Returns the chain of nav items from the top level down to the item that matches the URL.
 * Example: "/settings/profile" -> [Settings, Profile]. Returns [] when nothing matches.
 */
export function findNavTrail(items: NavItem[], pathname: string): NavItem[] {
  for (const item of items) {
    const childItems = item.children ?? [];
    const childTrail = findNavTrail(childItems, pathname);
    if (childTrail.length > 0) {
      return [item, ...childTrail];
    }
    const isMatch = isPathMatch(item.path, pathname);
    if (isMatch) {
      return [item];
    }
  }
  return [];
}

/** true when the item or one of its children matches the URL path. */
export function isNavItemActive(item: NavItem, pathname: string): boolean {
  const trail = findNavTrail([item], pathname);
  return trail.length > 0;
}
