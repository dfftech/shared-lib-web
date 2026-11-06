// header.tsx
// Top bar.
// - Small screens: menu button opens the drawer.
// - Desktop + sidebar mode: the collapse button is at the bottom of the Sidebar (SidebarCollapseButton).
// - Desktop + megamenu mode: brand, mega menu bar and full-width panel.
// - Right side: branch switcher (when the app passes branches), extra content (for example UserMenu),
//   language and theme switchers.

import type { ReactNode } from "react";
import { AppBrand } from "../components/app-brand.tsx";
import { BranchSwitcher } from "../components/branch-switcher.tsx";
import { LanguageSwitcher } from "../components/language-switcher.tsx";
import { SettingsMenu } from "../components/settings-menu.tsx";
import { ThemeSwitcher } from "../components/theme-switcher.tsx";
import { useUi } from "../context/use-ui.ts";
import { toggleSidebar } from "../state/sidebar-service.ts";
import { isMenuVisibleSignal, navigationModeSignal } from "../state/signals.ts";
import { TypeIcon } from "../types/type.icon.ts";
import { MegaMenuBar, MegaMenuPanel } from "./mega-menu.tsx";

export interface HeaderProps {
  /** Extra content on the right, for example <UserMenu />. */
  endContent?: ReactNode;
  /** Extra content on the left, after the brand. */
  startContent?: ReactNode;
  /** Show the menu button (small screens). Default: the menu is on (isMenuVisibleSignal). */
  showMenuButtons?: boolean;
  /** Show the language / theme switchers (or the settings button). Default true. */
  showSwitchers?: boolean;
  /**
   * true when the header is used in an own layout without the library Sidebar:
   * the brand is always shown on desktop. Default false.
   */
  isStandalone?: boolean;
}

export function Header(props: HeaderProps) {
  const { endContent, startContent, showSwitchers = true, isStandalone = false } = props;
  const { config, t } = useUi();
  const isMenuVisible = isMenuVisibleSignal.value;
  const showMenuButtons = props.showMenuButtons ?? isMenuVisible;
  const isMegaMenuMode = navigationModeSignal.value === "megamenu";
  const isMegaMenu = isMegaMenuMode && isMenuVisible;
  const isSettingsMenu = config.layout?.headerSettings === "menu";
  const openMenuText = t("ui.openMenu");
  const isBrandAlwaysShown = isMegaMenuMode || isStandalone || !showMenuButtons;
  const brandNameClassName = isBrandAlwaysShown ? undefined : "lg:hidden";
  const brandClassName = isBrandAlwaysShown ? undefined : "lg:hidden";

  return (
    <header
      className="navbar sticky top-0 z-30 min-h-16 gap-2 border-b border-base-300 bg-base-100/90 px-2 backdrop-blur lg:px-4"
    >
      <div className="flex flex-none items-center gap-1">
        {showMenuButtons ? (
          <button type="button" className="btn btn-square btn-ghost lg:hidden" aria-label={openMenuText} onClick={toggleSidebar}>
            <TypeIcon name="Menu" size={20} />
          </button>
        ) : null}
        <AppBrand className={brandClassName} nameClassName={brandNameClassName} />
        {startContent}
      </div>
      <div className="flex flex-1 items-center justify-center">{isMegaMenu ? <MegaMenuBar /> : null}</div>
      <div className="flex flex-none items-center gap-1">
        {showSwitchers ? <BranchSwitcher /> : null}
        {showSwitchers && isSettingsMenu ? <SettingsMenu /> : null}
        {showSwitchers && !isSettingsMenu ? <LanguageSwitcher /> : null}
        {showSwitchers && !isSettingsMenu ? <ThemeSwitcher /> : null}
        {endContent}
      </div>
      {isMegaMenu ? <MegaMenuPanel /> : null}
    </header>
  );
}
