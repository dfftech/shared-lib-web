// mega-menu.tsx
// Top navigation for menuMode "megamenu" (desktop only).
// - MegaMenuBar: one entry per top-level item. Groups open a panel.
// - MegaMenuPanel: full-width panel under the header with a card per child item
//   (icon, label, description). Grandchildren become a list under their parent.
// Closes on outside click, Escape, or after a link is clicked.

import type { ReactElement } from "react";
import { createPortal } from "react-dom";
import { useUi } from "../context/use-ui.ts";
import type { NavItem } from "../interfaces/ui-config.ts";
import type { TranslateFunction } from "../interfaces/ui-context.ts";
import { PageLink } from "../query/page-link.tsx";
import {
  closeMegaMenu,
  filterVisibleNavigation,
  handleMegaMenuTriggerClick,
} from "../state/navigation-service.ts";
import { navigationSignal, openMegaMenuIdSignal, currentPageSignal } from "../state/signals.ts";
import { joinClassNames } from "../types/class-names.ts";
import { TypeIcon } from "../types/type.icon.ts";
import { readNavLabel } from "../utils/lang-util.ts";
import { findNavItemById } from "./rail-flyout.tsx";
import { isNavItemActive } from "./navigation.ts";

/** Builds the top bar entries. */
function buildBarEntries(items: NavItem[], openId: string, currentPage: string): ReactElement[] {
  const entries: ReactElement[] = [];
  for (const item of items) {
    const label = readNavLabel(item);
    const iconElement = item.icon ? <TypeIcon name={item.icon} size={16} /> : null;
    const childItems = item.children ?? [];
    const hasChildren = childItems.length > 0;
    if (!hasChildren) {
      const path = item.path ?? "/";
      const isRootPath = path === "/";
      const linkEntry = (
        <li key={item.id}>
          <PageLink page={path} isExact={isRootPath} className="btn btn-sm btn-ghost" activeClassName="bg-base-200 text-primary">
            {iconElement}
            {label}
          </PageLink>
        </li>
      );
      entries.push(linkEntry);
      continue;
    }
    const isOpen = item.id === openId;
    const isActive = isNavItemActive(item, currentPage);
    const triggerClassList = ["btn btn-sm btn-ghost", isActive ? "bg-base-200 text-primary" : "", isOpen ? "btn-active" : ""];
    const triggerClassName = joinClassNames(triggerClassList);
    const chevronClassName = isOpen ? "rotate-180 transition-transform" : "transition-transform";
    const groupEntry = (
      <li key={item.id}>
        <button
          type="button"
          className={triggerClassName}
          aria-expanded={isOpen}
          aria-haspopup="menu"
          data-menu-id={item.id}
          onClick={handleMegaMenuTriggerClick}
        >
          {iconElement}
          {label}
          <TypeIcon name="ChevronDown" size={14} className={chevronClassName} />
        </button>
      </li>
    );
    entries.push(groupEntry);
  }
  return entries;
}

export function MegaMenuBar() {
  const { t } = useUi();
  const openId = openMegaMenuIdSignal.value;
  const currentPage = currentPageSignal.value;
  const visibleItems = filterVisibleNavigation(navigationSignal.value);
  const entries = buildBarEntries(visibleItems, openId, currentPage);
  const navigationText = t("ui.navigation");
  return (
    <nav aria-label={navigationText} className="hidden lg:block">
      <ul className="flex items-center gap-1">{entries}</ul>
    </nav>
  );
}

/** Builds the link list for grandchildren. */
function buildSubLinks(items: NavItem[]): ReactElement[] {
  const links: ReactElement[] = [];
  for (const item of items) {
    const label = readNavLabel(item);
    const path = item.path ?? "/";
    const link = (
      <li key={item.id}>
        <PageLink page={path} activeClassName="menu-active">
          {label}
        </PageLink>
      </li>
    );
    links.push(link);
  }
  return links;
}

/** Builds one card (or column) per child of the open group. */
function buildPanelCards(items: NavItem[], t: TranslateFunction): ReactElement[] {
  const cards: ReactElement[] = [];
  for (const item of items) {
    const label = readNavLabel(item);
    const description = item.descriptionKey ? t(item.descriptionKey) : undefined;
    const iconName = item.icon ?? "Circle";
    // Small icon box (2rem, icon 16px) so the icon sits on one line with the label; with a description the
    // icon stays at the top, next to the label.
    const iconBox = (
      <span className="flex size-8 shrink-0 items-center justify-center rounded-field bg-primary/10 text-primary">
        <TypeIcon name={iconName} size={16} />
      </span>
    );
    const textBlock = (
      <span className="flex min-w-0 flex-col justify-center">
        <span className="truncate text-sm font-semibold leading-8">{label}</span>
        {description ? <span className="-mt-1 text-xs opacity-70">{description}</span> : null}
      </span>
    );
    const grandChildren = item.children ?? [];
    if (grandChildren.length > 0) {
      const subLinks = buildSubLinks(grandChildren);
      const column = (
        <div key={item.id} className="flex flex-col gap-2 p-3">
          <div className="flex items-start gap-3">
            {iconBox}
            {textBlock}
          </div>
          <ul className="menu menu-sm w-full p-0 ps-9">{subLinks}</ul>
        </div>
      );
      cards.push(column);
      continue;
    }
    const path = item.path ?? "/";
    const card = (
      <PageLink
        key={item.id}
        page={path}
        className="flex items-start gap-3 rounded-box px-3 py-2 transition-colors hover:bg-base-200"
        activeClassName="bg-base-200 text-primary"
      >
        {iconBox}
        {textBlock}
      </PageLink>
    );
    cards.push(card);
  }
  return cards;
}

export function MegaMenuPanel() {
  const { t } = useUi();
  const openId = openMegaMenuIdSignal.value;
  if (!openId) {
    return null;
  }
  const visibleItems = filterVisibleNavigation(navigationSignal.value);
  const group = findNavItemById(visibleItems, openId);
  if (!group) {
    return null;
  }
  const groupLabel = readNavLabel(group);
  const childItems = group.children ?? [];
  const cards = buildPanelCards(childItems, t);
  const closeText = t("ui.close");
  // The header has backdrop-blur, which makes it the box for "fixed" children, so the dimmed backdrop that closes
  // the panel on an outside click is rendered into <body> (below the header, above the page).
  const backdropButton = (
    <button
      type="button"
      className="fixed inset-x-0 bottom-0 top-16 z-20 hidden cursor-default bg-base-content/20 lg:block"
      aria-label={closeText}
      onClick={closeMegaMenu}
    />
  );
  const backdrop = createPortal(backdropButton, document.body);

  // lg:contents: the wrapper makes no box of its own, so opening the panel does not add a flex item (and a gap)
  // to the header bar — the menu, settings and user buttons stay exactly where they are.
  return (
    <div className="hidden lg:contents">
      {backdrop}
      {/* Thin top line: separates the main menu bar from the open sub menu panel. */}
      <div
        role="menu"
        aria-label={groupLabel}
        className="absolute inset-x-0 top-full z-30 border-t border-b border-base-300 bg-base-100 shadow-xl"
      >
        <div className="mx-auto max-w-7xl px-6 py-6">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide opacity-60">{groupLabel}</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">{cards}</div>
        </div>
      </div>
    </div>
  );
}
