// rail-flyout.tsx
// When the desktop sidebar is collapsed to icons, a group opens this small menu next to the rail.
// Closes on outside click, Escape, or after a link is clicked.

import type { ReactElement } from "react";
import { useUi } from "../context/use-ui.ts";
import type { NavItem } from "../interfaces/ui-config.ts";
import { PageLink } from "../query/page-link.tsx";
import { closeRailFlyout, filterVisibleNavigation } from "../state/navigation-service.ts";
import { isRailEverywhereSignal, navigationSignal, railFlyoutSignal } from "../state/signals.ts";
import { TypeIcon } from "../types/type.icon.ts";
import { readNavLabel } from "../utils/lang-util.ts";

/** Finds a top-level item by id. */
export function findNavItemById(items: NavItem[], itemId: string): NavItem | undefined {
  for (const item of items) {
    if (item.id === itemId) {
      return item;
    }
  }
  return undefined;
}

/** Builds the flyout links. */
function buildFlyoutLinks(items: NavItem[]): ReactElement[] {
  const links: ReactElement[] = [];
  for (const item of items) {
    const label = readNavLabel(item);
    const path = item.path ?? "/";
    const iconElement = item.icon ? <TypeIcon name={item.icon} size={16} /> : null;
    const link = (
      <li key={item.id}>
        <PageLink page={path} activeClassName="menu-active">
          {iconElement}
          {label}
        </PageLink>
      </li>
    );
    links.push(link);
  }
  return links;
}

export function RailFlyout() {
  const { t } = useUi();
  const flyout = railFlyoutSignal.value;
  if (!flyout.groupId) {
    return null;
  }
  const visibleItems = filterVisibleNavigation(navigationSignal.value);
  const group = findNavItemById(visibleItems, flyout.groupId);
  if (!group) {
    return null;
  }
  const groupLabel = readNavLabel(group);
  const childItems = group.children ?? [];
  const links = buildFlyoutLinks(childItems);
  const closeText = t("ui.close");
  const panelStyle = { top: flyout.top };
  // AsideLayout uses the rail on small screens too, so the flyout is shown there as well.
  const wrapperClassName = isRailEverywhereSignal.value ? undefined : "hidden lg:block";

  return (
    <div className={wrapperClassName}>
      <button type="button" className="fixed inset-0 z-40 cursor-default" aria-label={closeText} onClick={closeRailFlyout} />
      <div
        role="menu"
        aria-label={groupLabel}
        style={panelStyle}
        className="fixed start-22 z-50 w-60 rounded-box border border-base-300 bg-base-100 p-2 shadow-xl"
      >
        <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wide opacity-60">{groupLabel}</p>
        <ul className="menu menu-sm w-full p-0">{links}</ul>
      </div>
    </div>
  );
}
