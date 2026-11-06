// settings.page.ts — TypeScript only.
// Shows how to use the shell API:
//   const { locale, theme, direction, t } = useUi();     // values (re-render on change)
//   changeLanguage("fr"); changeTheme("dark");           // actions (same functions useUi() returns)
import {
  DEFAULT_BRANCH_LABEL,
  branchIdSignal,
  branchesSignal,
  changeLanguage,
  changeNavigationMode,
  changeTheme,
  isMenuVisibleSignal,
  navigationSignal,
  setMenuVisible,
  navigationModeSignal,
  readDataValue,
  useUi,
  type BranchOption,
  type LanguageOption,
  type NavigationMode,
  type Theme,
} from "shared-lib-web";
import type { MouseEvent } from "react";
import { layoutChoiceSignal, type LayoutChoice } from "../../layout/layout-choice.ts";

export interface SettingsModel {
  titleText: string;
  /** Branches from the backend ([] = no branch section). */
  branches: BranchOption[];
  branchId: string;
  /** Title from config.branchLabel. */
  branchTitle: string;
  /** false while there are no menu items (nav null / []): no sidebar / mega menu choice. */
  hasMenu: boolean;
  languageTitle: string;
  themeTitle: string;
  navigationTitle: string;
  sidebarText: string;
  megaMenuText: string;
  navigationMode: NavigationMode;
  layoutTitle: string;
  singleLayoutText: string;
  mainLayoutText: string;
  asideLayoutText: string;
  menuTitle: string;
  menuOnText: string;
  menuOffText: string;
  isMenuVisible: boolean;
  layoutChoice: LayoutChoice;
  currentText: string;
  locale: string;
  theme: Theme;
  languages: LanguageOption[];
  lightThemes: Theme[];
  darkThemes: Theme[];
  lightThemesTitle: string;
  darkThemesTitle: string;
}

/** Language buttons carry the language code in data-value. */
export function handleSettingsLanguageClick(event: MouseEvent<HTMLButtonElement>): void {
  const button = event.currentTarget;
  const languageCode = button.dataset.value;
  if (languageCode) {
    void changeLanguage(languageCode);
  }
}

/** Theme buttons carry the theme name in data-value. */
export function handleSettingsThemeClick(event: MouseEvent<HTMLButtonElement>): void {
  const button = event.currentTarget;
  const themeName = button.dataset.value;
  if (themeName) {
    changeTheme(themeName);
  }
}

/** Navigation buttons carry "sidebar" or "megamenu" in data-value. */
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
  const { t, config, locale, theme, direction, languages, lightThemes, darkThemes } = useUi();
  const currentParams = { locale: locale, theme: theme, direction: direction };
  const branchLabelKey = config.branchLabel ?? DEFAULT_BRANCH_LABEL;
  return {
    titleText: t("settings.title"),
    branches: branchesSignal.value,
    branchId: branchIdSignal.value,
    branchTitle: t(branchLabelKey),
    hasMenu: navigationSignal.value.length > 0,
    languageTitle: t("settings.language"),
    themeTitle: t("settings.theme"),
    navigationTitle: t("settings.navigation"),
    sidebarText: t("settings.sidebar"),
    megaMenuText: t("settings.megamenu"),
    navigationMode: navigationModeSignal.value,
    layoutTitle: t("settings.layout"),
    singleLayoutText: t("settings.singleLayout"),
    mainLayoutText: t("settings.mainLayout"),
    asideLayoutText: t("settings.asideLayout"),
    menuTitle: t("settings.menu"),
    menuOnText: t("settings.menuOn"),
    menuOffText: t("settings.menuOff"),
    isMenuVisible: isMenuVisibleSignal.value,
    layoutChoice: layoutChoiceSignal.value,
    currentText: t("settings.current", currentParams),
    locale: locale,
    theme: theme,
    languages: languages,
      lightThemes: lightThemes,
    darkThemes: darkThemes,
    lightThemesTitle: t("ui.lightThemes"),
    darkThemesTitle: t("ui.darkThemes"),
  };
}
