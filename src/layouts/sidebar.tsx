// sidebar.tsx
// Left navigation built from the navigation items (config.navigation or setNavigation()).
// - Small screens: slides in as a DaisyUI drawer with labels.
// - Desktop, collapsed: an icon rail; groups open a flyout (rail-flyout.tsx).
// - Items with permissions.read === false are hidden.
// - Desktop: the collapse / expand button is fixed at the bottom of the sidebar (SidebarCollapseButton).
// - AsideLayout: the rail is also used on small screens (isRailEverywhereSignal); the rail classes then
//   have no "lg:" prefix.
// In RTL languages DaisyUI moves the drawer to the right side automatically.

import type { ReactElement, ReactNode } from "react";
import { AppBrand } from "../components/app-brand.tsx";
import { useUi } from "../context/use-ui.ts";
import type { NavItem } from "../interfaces/ui-config.ts";
import { SkeletonMenu } from "../skeleton/skeleton-menu.tsx";
import { PageLink } from "../query/page-link.tsx";
import { filterVisibleNavigation, handleRailGroupClick, toggleSidebarCollapsed } from "../state/navigation-service.ts";
import {
  isDesktopSidebarSignal,
  isMenuVisibleSignal,
  isRailEverywhereSignal,
  isSidebarCollapsedSignal,
  navigationLoadingSignal,
  navigationSignal,
  currentPageSignal,
} from "../state/signals.ts";
import { joinClassNames } from "../types/class-names.ts";
import { TypeIcon } from "../types/type.icon.ts";
import { readNavLabel } from "../utils/lang-util.ts";
import { isNavItemActive } from "./navigation.ts";
import { handleRailTooltipFocus, handleRailTooltipMouseOver, hideRailTooltip } from "./rail-tooltip.tsx";

/** Rail entries (links and group buttons) share one size, so every icon sits in the middle of the rail. */
const RAIL_ITEM_CLASS = "w-full justify-center px-0";

/** Links show their label on small screens (drawer), so the rail look only applies from lg. */
const RAIL_LINK_CLASS = "lg:w-full lg:justify-center lg:px-0";

/** Collapsed-rail classes: desktop only ("lg:") or on every screen size (AsideLayout on small screens). */
interface RailClasses {
  center: string;
  brandBox: string;
  hidden: string;
  narrow: string;
}

const RAIL_DESKTOP_CLASSES: RailClasses = { center: "lg:justify-center", brandBox: "lg:justify-center lg:px-0", hidden: "lg:hidden", narrow: "lg:px-2" };
const RAIL_EVERYWHERE_CLASSES: RailClasses = { center: "justify-center", brandBox: "justify-center px-0", hidden: "hidden", narrow: "px-2" };

/** Boxes at the bottom of the sidebar (tools, user). */
const BOTTOM_BOX_CLASS = "shrink-0 border-t border-base-300 p-3";
const TOOLS_BOX_CLASS = "flex shrink-0 flex-col gap-1 border-t border-base-300 p-3";

/** Box around the logo at the top of the sidebar. */
const BRAND_BOX_CLASS = "flex h-16 shrink-0 items-center border-b border-base-300 px-4";

export interface SidebarProps {
  /** Content at the bottom of the sidebar, for example a version number. Hidden on the collapsed rail. */
  footer?: ReactNode;
  /** Show the logo + app name at the top. Default true. */
  showBrand?: boolean;
  /** User block at the bottom, above the collapse button, for example <UserMenu isInSidebar ... />. Also shown on the collapsed rail. */
  user?: ReactNode;
  /** Show the collapse / expand button fixed at the bottom (desktop only). Default config.layout.isSidebarCollapsible ?? true. */
  showCollapseButton?: boolean;
  /** Small tools above the user block, for example <SettingsMenu isInSidebar />. */
  tools?: ReactNode;
}

export interface SidebarCollapseButtonProps {
  /** Extra classes for the bar around the button. */
  className?: string;
}

export interface SidebarNavProps {
  /** Show the menu even when it is switched off with setMenuVisible(false). Default false. */
  isAlwaysShown?: boolean;
  /** Extra classes for the <ul class="menu">. */
  className?: string;
  /** Show labels even when the sidebar is collapsed (for example in an own drawer). Default false. */
  isAlwaysExpanded?: boolean;
}

interface SidebarItemProps {
  item: NavItem;
  isCollapsed: boolean;
  /** Rail on every screen size (AsideLayout): rail classes without the "lg:" prefix. */
  isRailEverywhere: boolean;
  /** Item inside a group (no separator line). */
  isNested: boolean;
  currentPage: string;
}

/** Thin line under every top-level entry (link or group, open or collapsed rail), so the menu reads as sections. */
const ITEM_SEPARATOR_CLASS = "border-b border-base-300/70 pb-1.5";

/**
 * Menu spacing: a small gap between entries, a bit more height for top-level rows,
 * and a little room between the rows of an open group.
 */
const MENU_CLASS = "menu w-full gap-1.5 p-3 [&>li>a]:py-2 [&>li>details>summary]:py-2 [&_ul]:mt-1 [&_ul]:space-y-0.5";

/** Builds one SidebarItem per nav item. */
function buildSidebarItems(
  items: NavItem[],
  isCollapsed: boolean,
  isRailEverywhere: boolean,
  currentPage: string,
  isNested: boolean = false,
): ReactElement[] {
  const elements: ReactElement[] = [];
  for (const item of items) {
    const element = (
      <SidebarItem key={item.id} item={item} isCollapsed={isCollapsed} isRailEverywhere={isRailEverywhere} isNested={isNested} currentPage={currentPage} />
    );
    elements.push(element);
  }
  return elements;
}

/** One menu entry. Renders itself again for child items (a group). */
function SidebarItem(props: SidebarItemProps) {
  const { item, isCollapsed, isRailEverywhere, isNested, currentPage } = props;
  useUi();
  const label = readNavLabel(item);
  const iconElement = item.icon ? <TypeIcon name={item.icon} size={18} /> : null;
  const hiddenOnRailClass = isRailEverywhere ? "hidden" : "lg:hidden";
  const labelClassName = isCollapsed ? hiddenOnRailClass : undefined;
  const separatorClass = isNested ? undefined : ITEM_SEPARATOR_CLASS;
  const childItems = item.children ?? [];
  const hasChildren = childItems.length > 0;

  if (hasChildren) {
    const isActive = isNavItemActive(item, currentPage);
    const childElements = buildSidebarItems(childItems, false, false, currentPage, true);
    const groupClassList = [isCollapsed ? hiddenOnRailClass : undefined, separatorClass];
    const groupClassName = joinClassNames(groupClassList);
    const railGroupClassList = [isRailEverywhere ? undefined : "hidden lg:block", separatorClass];
    const railGroupClassName = joinClassNames(railGroupClassList);

    const railButtonClassName = isActive ? `${RAIL_ITEM_CLASS} menu-active` : RAIL_ITEM_CLASS;
    return (
      <>
        <li className={groupClassName}>
          <details open={isActive}>
            <summary>
              {iconElement}
              {label}
            </summary>
            <ul>{childElements}</ul>
          </details>
        </li>
        {isCollapsed ? (
          <li className={railGroupClassName} data-rail-tip={label}>
            <button
              type="button"
              aria-label={label}
              aria-haspopup="menu"
              className={railButtonClassName}
              data-menu-id={item.id}
              onClick={handleRailGroupClick}
            >
              {iconElement}
            </button>
          </li>
        ) : null}
      </>
    );
  }

  const path = item.path ?? "/";
  const isRootPath = path === "/";
  const railLinkClass = isRailEverywhere ? RAIL_ITEM_CLASS : RAIL_LINK_CLASS;
  const linkClassName = isCollapsed ? railLinkClass : undefined;
  const railTip = isCollapsed ? label : undefined;
  return (
    <li className={separatorClass} data-rail-tip={railTip}>
      <PageLink page={path} isExact={isRootPath} label={railTip} className={linkClassName} activeClassName="menu-active">
        {iconElement}
        <span className={labelClassName}>{label}</span>
      </PageLink>
    </li>
  );
}

/**
 * Only the menu of the navigation items (skeleton while loading), for an own sidebar, drawer or panel.
 * Hidden when the menu is off; on desktop also hidden in "megamenu" mode (the header shows the menu then).
 *   <aside className="w-64"><SidebarNav /></aside>
 */
export function SidebarNav(props: SidebarNavProps) {
  const { className, isAlwaysExpanded = false, isAlwaysShown = false } = props;
  const { t } = useUi();
  const isMenuVisible = isMenuVisibleSignal.value;
  const isDesktopSidebar = isDesktopSidebarSignal.value;
  const isCollapsedState = isSidebarCollapsedSignal.value;
  const isRailEverywhereState = isRailEverywhereSignal.value;
  const isRailEverywhere = isAlwaysExpanded ? false : isRailEverywhereState;
  const isCollapsed = isAlwaysExpanded ? false : isCollapsedState || isRailEverywhere;
  const isLoading = navigationLoadingSignal.value;
  const currentPage = currentPageSignal.value;
  const allItems = navigationSignal.value;
  const visibleItems = filterVisibleNavigation(allItems);
  const itemElements = buildSidebarItems(visibleItems, isCollapsed, isRailEverywhere, currentPage);
  const navigationText = t("ui.navigation");
  const menuClassList = [MENU_CLASS, className];
  const menuClassName = joinClassNames(menuClassList);
  if (!isMenuVisible && !isAlwaysShown) {
    return null;
  }

  return (
    <nav aria-label={navigationText} className={isDesktopSidebar ? "flex-1 overflow-y-auto" : "flex-1 overflow-y-auto lg:hidden"}>
      {isLoading ? <SkeletonMenu /> : <ul className={menuClassName}>{itemElements}</ul>}
    </nav>
  );
}

/**
 * Collapse / expand button for the desktop sidebar: icon + label, only the icon on the collapsed rail.
 * Shown only on desktop in "sidebar" mode. The library Sidebar puts it at the bottom; own layouts can place it anywhere.
 */
export function SidebarCollapseButton(props: SidebarCollapseButtonProps) {
  const { t } = useUi();
  const isDesktopSidebar = isDesktopSidebarSignal.value;
  const isCollapsed = isSidebarCollapsedSignal.value;
  const collapseText = isCollapsed ? t("ui.expandMenu") : t("ui.collapseMenu");
  const collapseIcon = isCollapsed ? "PanelLeftOpen" : "PanelLeftClose";
  const barClassList = ["hidden shrink-0 border-t border-base-300 p-3 lg:block", props.className];
  const barClassName = joinClassNames(barClassList);
  const buttonClassName = isCollapsed ? "btn btn-ghost w-full justify-center px-0" : "btn btn-ghost w-full justify-start gap-3";
  if (!isDesktopSidebar) {
    return null;
  }

  return (
    <div className={barClassName} data-rail-tip={isCollapsed ? collapseText : undefined}>
      <button
        type="button"
        className={buttonClassName}
        aria-label={collapseText}
        aria-expanded={!isCollapsed}
        onClick={toggleSidebarCollapsed}
      >
        <TypeIcon name={collapseIcon} size={18} className="rtl:-scale-x-100" />
        {isCollapsed ? null : <span className="font-normal">{collapseText}</span>}
      </button>
    </div>
  );
}

export function Sidebar(props: SidebarProps) {
  const { footer, user, tools, showBrand = true } = props;
  const { config } = useUi();
  const isCollapsible = config.layout?.isSidebarCollapsible ?? true;
  const showCollapseButton = props.showCollapseButton ?? isCollapsible;
  const isRailEverywhere = isRailEverywhereSignal.value;
  const isCollapsed = isSidebarCollapsedSignal.value || isRailEverywhere;
  const desktopWidthClass = isCollapsed ? "w-72 lg:w-20" : "w-72";
  const asideClassList = [
    "flex h-full min-h-full flex-col border-e border-base-300 bg-base-100 text-base-content transition-[width] duration-200 lg:translate-none lg:will-change-auto",
    isRailEverywhere ? "w-20" : desktopWidthClass,
  ];
  const asideClassName = joinClassNames(asideClassList);
  // Collapsed classes: "lg:"-prefixed for the desktop rail, plain when the rail is used on every screen size.
  // (Written out in full so Tailwind finds every class.)
  const railClasses = isRailEverywhere ? RAIL_EVERYWHERE_CLASSES : RAIL_DESKTOP_CLASSES;
  const brandClassName = isCollapsed ? railClasses.center : undefined;
  const brandBoxClassName = isCollapsed ? `${BRAND_BOX_CLASS} ${railClasses.brandBox}` : BRAND_BOX_CLASS;
  const brandNameClassName = isCollapsed ? railClasses.hidden : undefined;
  const userClassName = isCollapsed ? `${BOTTOM_BOX_CLASS} ${railClasses.narrow}` : BOTTOM_BOX_CLASS;
  const toolsClassName = isCollapsed ? `${TOOLS_BOX_CLASS} ${railClasses.narrow}` : TOOLS_BOX_CLASS;
  const footerClassName = isCollapsed ? `border-t border-base-300 p-4 text-sm ${railClasses.hidden}` : "border-t border-base-300 p-4 text-sm";

  return (
    <aside
      className={asideClassName}
      onMouseOver={handleRailTooltipMouseOver}
      onMouseLeave={hideRailTooltip}
      onFocus={handleRailTooltipFocus}
      onBlur={hideRailTooltip}
      onClick={hideRailTooltip}
    >
      {showBrand ? (
        <div className={brandBoxClassName}>
          <AppBrand className={brandClassName} nameClassName={brandNameClassName} />
        </div>
      ) : null}
      <SidebarNav />
      {footer ? <div className={footerClassName}>{footer}</div> : null}
      {tools ? <div className={toolsClassName}>{tools}</div> : null}
      {user ? <div className={userClassName}>{user}</div> : null}
      {showCollapseButton ? <SidebarCollapseButton /> : null}
    </aside>
  );
}
