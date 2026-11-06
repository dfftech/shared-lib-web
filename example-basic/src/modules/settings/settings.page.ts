// settings.page.ts — TypeScript only. Basic example: one language and no branches, so only theme and menu settings.
//   const { theme, t } = useUi();                     // values (re-render on change)
//   changeTheme("dark"); changeNavigationMode("megamenu"); setMenuVisible(false);
import {
  changeNavigationMode,
  changeTheme,
  isMenuVisibleSignal,
  navigationModeSignal,
  navigationSignal,
  readDataValue,
  setMenuVisible,
  useUi,
  type NavigationMode,
  type Theme,
} from "shared-lib-web";
import type { MouseEvent } from "react";

export interface SettingsModel {
  titleText: string;
  currentText: string;
  themeTitle: string;
  lightThemesTitle: string;
  darkThemesTitle: string;
  theme: Theme;
  lightThemes: Theme[];
  darkThemes: Theme[];
  navigationTitle: string;
  sidebarText: string;
  megaMenuText: string;
  navigationMode: NavigationMode;
  /** false while there are no menu items: no sidebar / mega menu choice. */
  hasMenu: boolean;
  menuTitle: string;
  menuOnText: string;
  menuOffText: string;
  isMenuVisible: boolean;
}

/** Theme buttons carry the theme name in data-value. */
export function handleSettingsThemeClick(event: MouseEvent<HTMLButtonElement>): void {
  const themeName = readDataValue(event);
  if (themeName) {
    changeTheme(themeName);
  }
}

/** Menu mode buttons carry "sidebar" or "megamenu" in data-value. */
export function handleSettingsNavigationClick(event: MouseEvent<HTMLButtonElement>): void {
  const mode = readDataValue(event) as NavigationMode;
  changeNavigationMode(mode);
}

/** Menu buttons carry "on" or "off" in data-value: the menu is switched at runtime, no reload. */
export function handleSettingsMenuClick(event: MouseEvent<HTMLButtonElement>): void {
  const isVisible = readDataValue(event) === "on";
  setMenuVisible(isVisible);
}

export function useSettings(): SettingsModel {
  const { t, locale, theme, direction, lightThemes, darkThemes } = useUi();
  const currentParams = { locale: locale, theme: theme, direction: direction };
  return {
    titleText: t("settings.title"),
    currentText: t("settings.current", currentParams),
    themeTitle: t("settings.theme"),
    lightThemesTitle: t("ui.lightThemes"),
    darkThemesTitle: t("ui.darkThemes"),
    theme: theme,
    lightThemes: lightThemes,
    darkThemes: darkThemes,
    navigationTitle: t("settings.navigation"),
    sidebarText: t("settings.sidebar"),
    megaMenuText: t("settings.megamenu"),
    navigationMode: navigationModeSignal.value,
    hasMenu: navigationSignal.value.length > 0,
    menuTitle: t("settings.menu"),
    menuOnText: t("settings.menuOn"),
    menuOffText: t("settings.menuOff"),
    isMenuVisible: isMenuVisibleSignal.value,
  };
}
