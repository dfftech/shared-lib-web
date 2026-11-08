// settings.page.ts — TypeScript only: handlers and the props of the shell's Settings page (/settings).
// Layout (app / aside), menu navigation (sidebar / mega menu), language and theme — saved as <KEY>-LAYOUT_CHOICE,
// <KEY>-MENU_MODE, <KEY>-LANG, <KEY>-THEME, so the shell switches at once and every MFE follows.
import {
  AppStorage,
  LANG,
  THEME,
  changeLanguage,
  changeLayoutChoice,
  changeNavigationMode,
  changeTheme,
  layoutChoiceSignal,
  navigationModeSignal,
  readDataValue,
  toLayoutChoice,
  useUi,
  type LanguageOption,
  type NavigationMode,
  type Theme,
  type TranslateFunction,
  type TypeButtonProps,
} from "shared-lib-web";
import type { MouseEvent } from "react";

/** One language button: its code (the React key) and its props. */
export interface LanguageButtonType {
  code: string;
  props: TypeButtonProps;
}

/** One theme button (the swatch button is plain HTML: it shows the theme's own colours). */
export interface ThemeButtonType {
  theme: Theme;
  isActive: boolean;
}

export interface SettingsModel {
  titleText: string;
  introText: string;
  layoutTitle: string;
  appLayoutProps: TypeButtonProps;
  asideLayoutProps: TypeButtonProps;
  /** The aside layout has no mega menu, so the menu navigation choice is only for the app layout. */
  showMenuChoice: boolean;
  menuTitle: string;
  sidebarProps: TypeButtonProps;
  megaMenuProps: TypeButtonProps;
  languageTitle: string;
  languageButtons: LanguageButtonType[];
  themeTitle: string;
  lightTitle: string;
  darkTitle: string;
  lightThemes: ThemeButtonType[];
  darkThemes: ThemeButtonType[];
  savedText: string;
}

/** Language buttons carry the code in data-value. Saved as <KEY>-LANG. */
function handleLanguageClick(event: MouseEvent<HTMLButtonElement>): void {
  const code = readDataValue(event);
  void changeLanguage(code);
}

/** Layout buttons carry "app" or "aside". Saved as <KEY>-LAYOUT_CHOICE; the shell switches its layout at once. */
function handleLayoutClick(event: MouseEvent<HTMLButtonElement>): void {
  const value = readDataValue(event);
  const choice = toLayoutChoice(value);
  changeLayoutChoice(choice);
}

/** Menu buttons carry "sidebar" or "megamenu". Saved as <KEY>-MENU_MODE; the shell menu switches. */
function handleMenuModeClick(event: MouseEvent<HTMLButtonElement>): void {
  const mode = readDataValue(event) as NavigationMode;
  changeNavigationMode(mode);
}

/** Theme buttons carry the theme in data-value. Saved as <KEY>-THEME. */
export function handleThemeClick(event: MouseEvent<HTMLButtonElement>): void {
  const theme = readDataValue(event);
  changeTheme(theme);
}

/** A button of a two-button group (join): primary when active. */
function buildChoiceProps(label: string, icon: TypeButtonProps["icon"], value: string, isActive: boolean, onPress: TypeButtonProps["onPress"]): TypeButtonProps {
  return {
    size: "sm",
    icon: icon,
    action: isActive ? "primary" : "ghost",
    className: "join-item border border-base-300",
    label: label,
    dataValue: value,
    onPress: onPress,
  };
}

function buildLanguageButtons(languages: LanguageOption[], activeCode: string): LanguageButtonType[] {
  const buttons: LanguageButtonType[] = [];
  for (const language of languages) {
    const isActive = language.code === activeCode;
    const label = `${language.flag ?? ""} ${language.label}`;
    const props: TypeButtonProps = {
      size: "sm",
      action: isActive ? "primary" : "ghost",
      className: isActive ? undefined : "border border-base-300",
      label: label,
      dataValue: language.code,
      onPress: handleLanguageClick,
    };
    buttons.push({ code: language.code, props: props });
  }
  return buttons;
}

function buildThemeButtons(themes: Theme[], activeTheme: Theme): ThemeButtonType[] {
  const buttons: ThemeButtonType[] = [];
  for (const theme of themes) {
    buttons.push({ theme: theme, isActive: theme === activeTheme });
  }
  return buttons;
}

/** What the MFEs will read (empty until the user picks something). */
function buildSavedText(t: TranslateFunction): string {
  const savedLanguage = AppStorage.getText(LANG) || "-";
  const savedTheme = AppStorage.getText(THEME) || "-";
  const savedParams = { lang: savedLanguage, theme: savedTheme };
  return t("settings.saved", savedParams);
}

export function useSettingsPage(): SettingsModel {
  const { t, languages, locale, theme, lightThemes, darkThemes } = useUi();
  const isAppLayout = layoutChoiceSignal.value === "app";
  const isSidebarMode = navigationModeSignal.value === "sidebar";
  const appLayoutLabel = t("settings.appLayout");
  const asideLayoutLabel = t("settings.asideLayout");
  const sidebarLabel = t("settings.sidebar");
  const megaMenuLabel = t("settings.megaMenu");
  return {
    titleText: t("settings.title"),
    introText: t("settings.text"),
    layoutTitle: t("settings.layout"),
    appLayoutProps: buildChoiceProps(appLayoutLabel, "LayoutTemplate", "app", isAppLayout, handleLayoutClick),
    asideLayoutProps: buildChoiceProps(asideLayoutLabel, "PanelLeftDashed", "aside", !isAppLayout, handleLayoutClick),
    showMenuChoice: isAppLayout,
    menuTitle: t("settings.menu"),
    sidebarProps: buildChoiceProps(sidebarLabel, "PanelLeft", "sidebar", isSidebarMode, handleMenuModeClick),
    megaMenuProps: buildChoiceProps(megaMenuLabel, "PanelTop", "megamenu", !isSidebarMode, handleMenuModeClick),
    languageTitle: t("settings.language"),
    languageButtons: buildLanguageButtons(languages, locale),
    themeTitle: t("settings.theme"),
    lightTitle: t("ui.lightThemes"),
    darkTitle: t("ui.darkThemes"),
    lightThemes: buildThemeButtons(lightThemes, theme),
    darkThemes: buildThemeButtons(darkThemes, theme),
    savedText: buildSavedText(t),
  };
}
