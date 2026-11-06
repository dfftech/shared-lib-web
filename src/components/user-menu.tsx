// user-menu.tsx
// Avatar dropdown with the user name, menu items and log out.
// - In the header (default): a round avatar, the menu opens below.
// - In the sidebar (isInSidebar): avatar + name + email over the full width, the menu opens above;
//   on the collapsed rail only the avatar, the menu opens next to the rail.
//
//   <UserMenu name="Asha Rao" email="asha@example.com" items={userMenuItems} onLogout={handleLogout} />
//   <AppLayout sidebarUser={<UserMenu isInSidebar ... />}>   // at the bottom of the side menu

import type { MouseEventHandler, ReactElement } from "react";
import { useUi } from "../context/use-ui.ts";
import { PageLink } from "../query/page-link.tsx";
import { isRailEverywhereSignal, isSidebarCollapsedSignal } from "../state/signals.ts";
import { TypeIcon, type IconName } from "../types/type.icon.ts";

export interface UserMenuItem {
  id: string;
  /** Translation key (or text). */
  labelKey: string;
  icon?: IconName;
  /** Route to open. */
  path?: string;
  /** Click handler (used when there is no path). */
  onPress?: MouseEventHandler<HTMLButtonElement>;
}

export interface UserMenuProps {
  name: string;
  email?: string;
  avatarUrl?: string;
  items?: UserMenuItem[];
  /** Shows a "Log out" entry when set. */
  onLogout?: MouseEventHandler<HTMLButtonElement>;
  /** Sidebar look: full-width row with name and email, menu opens above (next to the rail when collapsed). Default false. */
  isInSidebar?: boolean;
}

interface UserAvatarProps {
  name: string;
  avatarUrl?: string;
}

/** Round picture, or the initials when there is no picture. */
function UserAvatar(props: UserAvatarProps) {
  const { name, avatarUrl } = props;
  const initials = readInitials(name);
  if (avatarUrl) {
    return (
      <div className="w-9 shrink-0 rounded-full">
        <img src={avatarUrl} alt="" />
      </div>
    );
  }
  return (
    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-content">
      {initials}
    </div>
  );
}

/** Dropdown and menu classes for the header, the open sidebar and the collapsed rail. */
interface UserMenuClasses {
  dropdown: string;
  trigger: string;
  menu: string;
}

function readUserMenuClasses(isInSidebar: boolean, isCollapsed: boolean, isRailEverywhere: boolean): UserMenuClasses {
  if (!isInSidebar) {
    return {
      dropdown: "dropdown dropdown-end",
      trigger: "btn btn-ghost btn-circle avatar",
      menu: "dropdown-content menu z-50 mt-2 w-60 rounded-box bg-base-100 p-2 shadow-lg",
    };
  }
  if (isRailEverywhere) {
    // AsideLayout rail (every screen size): the menu is always fixed next to the rail.
    return {
      dropdown: "dropdown dropdown-top w-full",
      trigger: "btn btn-ghost h-auto w-full justify-center px-0 py-1",
      menu: "dropdown-content menu fixed start-22 bottom-3 z-50 w-60 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg",
    };
  }
  if (isCollapsed) {
    // The sidebar scrolls (overflow), so on the narrow rail the menu is fixed next to it instead of inside it
    // (Sidebar sets lg:translate-none lg:will-change-auto so "fixed" is relative to the window, not the drawer).
    return {
      dropdown: "dropdown dropdown-top w-full",
      trigger: "btn btn-ghost h-auto w-full justify-center px-0 py-1 lg:justify-center",
      menu: "dropdown-content menu z-50 mb-2 w-60 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg lg:fixed lg:bottom-3 lg:start-22 lg:mb-0",
    };
  }
  return {
    dropdown: "dropdown dropdown-top w-full",
    trigger: "btn btn-ghost h-auto w-full flex-nowrap justify-start gap-3 px-2 py-1 text-start font-normal",
    menu: "dropdown-content menu z-50 mb-2 w-full rounded-box border border-base-300 bg-base-100 p-2 shadow-lg",
  };
}

/** First letters of the first two words: "Asha Rao" -> "AR". */
export function readInitials(name: string): string {
  const words = name.split(" ");
  let initials = "";
  for (const word of words) {
    if (initials.length >= 2) {
      break;
    }
    const firstLetter = word.charAt(0);
    initials += firstLetter;
  }
  return initials.toUpperCase();
}

/** Builds one menu entry per item. */
function buildUserMenuItems(items: UserMenuItem[], t: (key: string) => string): ReactElement[] {
  const elements: ReactElement[] = [];
  for (const item of items) {
    const label = t(item.labelKey);
    const iconElement = item.icon ? <TypeIcon name={item.icon} size={16} /> : null;
    const content = item.path ? (
      <PageLink page={item.path}>
        {iconElement}
        {label}
      </PageLink>
    ) : (
      <button type="button" onClick={item.onPress}>
        {iconElement}
        {label}
      </button>
    );
    const element = <li key={item.id}>{content}</li>;
    elements.push(element);
  }
  return elements;
}

export function UserMenu(props: UserMenuProps) {
  const { name, email, avatarUrl, items = [], onLogout, isInSidebar = false } = props;
  const { t } = useUi();
  const isRailEverywhere = isRailEverywhereSignal.value;
  const isCollapsed = isSidebarCollapsedSignal.value || isRailEverywhere;
  const classes = readUserMenuClasses(isInSidebar, isCollapsed, isRailEverywhere);
  const showDetails = isInSidebar && !isCollapsed;
  // On the collapsed rail the name shows as a tooltip (RailTooltip reads data-rail-tip).
  const railTip = isInSidebar && isCollapsed ? name : undefined;
  const itemElements = buildUserMenuItems(items, t);
  const logoutText = t("ui.logout");
  const accountText = t("ui.account");

  return (
    <div className={classes.dropdown} data-rail-tip={railTip}>
      <div tabIndex={0} role="button" className={classes.trigger} aria-label={accountText}>
        <UserAvatar name={name} avatarUrl={avatarUrl} />
        {showDetails ? (
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-semibold">{name}</span>
            {email ? <span className="truncate text-xs opacity-60">{email}</span> : null}
          </span>
        ) : null}
        {showDetails ? <TypeIcon name="ChevronsUpDown" size={16} className="shrink-0 opacity-60" /> : null}
      </div>
      <ul tabIndex={0} className={classes.menu}>
        <li className="menu-title">
          <span className="truncate text-base-content">{name}</span>
          {email ? <span className="truncate text-xs font-normal opacity-60">{email}</span> : null}
        </li>
        {itemElements}
        {onLogout ? (
          <li>
            <button type="button" className="text-error" onClick={onLogout}>
              <TypeIcon name="LogOut" size={16} />
              {logoutText}
            </button>
          </li>
        ) : null}
      </ul>
    </div>
  );
}
