// signals.ts
// All global UI state of the shell, kept in @preact/signals-react signals.
//
//   localeSignal       current language code       ("en")
//   themeSignal        current DaisyUI theme       ("light")
//   directionSignal    "ltr" or "rtl" (computed from localeSignal and the config)
//   translationSignal  loaded messages of the current language
//
// Read a value with  signalName.value.
// Change values only through changeLanguage() and changeTheme(),
// so that <html>, localStorage and translations stay in sync.

import { computed, signal } from "@preact/signals-react";
import { ConstValue } from "dff-util";
import { toPagePath } from "../query/page-path.ts";
import { resolveDirection } from "../i18n/direction.ts";
import type {
  Direction,
  LanguageOption,
  LocaleMessages,
  NavItem,
  NavigationMode,
  Theme,
  UiConfig,
} from "../interfaces/ui-config.ts";
import type { ToastItem } from "../interfaces/toast.ts";
import { DEFAULT_DARK_THEMES } from "../theme/dark-themes.ts";

/** The config given to <SharedWebUiProvider>. null until the provider renders. */
export const uiConfigSignal = signal<UiConfig | null>(null);

/** Current language code. */
export const localeSignal = signal<string>(ConstValue.EMPTY);

/** Current DaisyUI theme. */
export const themeSignal = signal<Theme>(ConstValue.LIGHT);

/** Messages of the current language. */
export const translationSignal = signal<LocaleMessages>({});

/** Messages of the fallback language, used when a key is missing. */
export const fallbackTranslationSignal = signal<LocaleMessages>({});

/** true once the first locale file has been loaded. */
export const isTranslationReadySignal = signal<boolean>(false);

/** true when the sidebar drawer is open on small screens. */
export const isSidebarOpenSignal = signal<boolean>(false);

/** true when the desktop sidebar is collapsed to an icon rail. */
export const isSidebarCollapsedSignal = signal<boolean>(false);

/** true when the menu (sidebar / mega menu bar) is shown. Change it any time with setMenuVisible(). */
export const isMenuVisibleSignal = signal<boolean>(true);

/** Current navigation items (from the config, or from setNavigation()). */
export const navigationSignal = signal<NavItem[]>([]);

/** true while the app loads its menus (the sidebar shows a skeleton). */
export const navigationLoadingSignal = signal<boolean>(false);

/** "sidebar" or "megamenu". */
export const navigationModeSignal = signal<NavigationMode>("sidebar");

/** The query parameters of the address bar ({ page: "/profiles", id: "42" }). Kept in sync by query-param.ts. */
export const queryParamsSignal = signal<Record<string, string>>({});

/** Default name of the query parameter that holds the current page. */
export const DEFAULT_PAGE_PARAM = "page";

/** Default home page (used when ?page is missing). */
export const DEFAULT_HOME_PAGE = "/";

function readCurrentPage(): string {
  const config = uiConfigSignal.value;
  const pageParam = config?.layout?.pageParam ?? DEFAULT_PAGE_PARAM;
  const homePage = config?.homePath ?? DEFAULT_HOME_PAGE;
  const queryParams = queryParamsSignal.value;
  const pageValue = queryParams[pageParam] ?? ConstValue.EMPTY;
  const page = toPagePath(pageValue);
  return page || homePage;
}

/** The current page as a menu href: ?page=profiles -> "/profiles"; no ?page -> config.homePath. */
export const currentPageSignal = computed(readCurrentPage);

/** id of the open mega menu group, or "" when closed. */
export const openMegaMenuIdSignal = signal<string>(ConstValue.EMPTY);

/** Open group flyout of the collapsed sidebar rail: group id and top position in px. */
/** Tooltip next to the collapsed rail (rail-tooltip.tsx): label text and the middle of the hovered icon. */
export const railTooltipSignal = signal<{ text: string; top: number }>({ text: ConstValue.EMPTY, top: 0 });
export const railFlyoutSignal = signal<{ groupId: string; top: number }>({ groupId: ConstValue.EMPTY, top: 0 });

/** true while a request runs (thin progress bar at the top). */
export const progressSignal = signal<boolean>(false);

/** true when the page is scrolled down (shows the scroll-to-top button). */
export const isScrolledSignal = signal<boolean>(false);

/** true when the settings dialog (header settings "menu" mode) is open. */
export const isSettingsOpenSignal = signal<boolean>(false);

/** Visible toast messages. */
export const toastsSignal = signal<ToastItem[]>([]);

/** Languages offered by the switchers: config.languages, or the backend list (lang prop / setLanguages). */
export const languagesSignal = signal<LanguageOption[]>([]);

function readDirection(): Direction {
  const languageCode = localeSignal.value;
  const languages = languagesSignal.value;
  const direction = resolveDirection(languageCode, languages);
  return direction;
}

/** true while an AsideLayout is on screen (no header, the sidebar is always there, no mega menu). */
export const isAsideLayoutSignal = signal<boolean>(false);

/** true on small screens (below the lg breakpoint, 1024px). Kept up to date by watchSmallScreen(). */
export const isSmallScreenSignal = signal<boolean>(false);

function readIsDesktopSidebar(): boolean {
  const isMenuVisible = isMenuVisibleSignal.value;
  const isSidebarMode = navigationModeSignal.value === "sidebar";
  const isAsideLayout = isAsideLayoutSignal.value;
  return isMenuVisible && (isSidebarMode || isAsideLayout);
}

/**
 * true when a sidebar belongs on desktop screens: the menu is on and the navigation mode is "sidebar"
 * (or an AsideLayout is used, which has no mega menu).
 * In "megamenu" mode the header shows the menu instead; small screens always use the drawer.
 * Own layouts use it to show or hide their menu column.
 */
export const isDesktopSidebarSignal = computed(readIsDesktopSidebar);

function readIsRailEverywhere(): boolean {
  const isAsideLayout = isAsideLayoutSignal.value;
  const isSmallScreen = isSmallScreenSignal.value;
  const isCollapsed = isSidebarCollapsedSignal.value;
  return isAsideLayout && (isSmallScreen || isCollapsed);
}

/**
 * true when the sidebar is an icon rail on EVERY screen size: AsideLayout on a small screen (always collapsed)
 * or AsideLayout collapsed on desktop. The rail classes then have no "lg:" prefix.
 */
export const isRailEverywhereSignal = computed(readIsRailEverywhere);

/** Current text direction, worked out from the language. */
export const directionSignal = computed(readDirection);

function readIsDarkTheme(): boolean {
  const config = uiConfigSignal.value;
  const theme = themeSignal.value;
  const darkThemes = config?.darkThemes ?? DEFAULT_DARK_THEMES;
  const isDark = darkThemes.includes(theme);
  return isDark;
}

/** true when the current theme is a dark theme. */
export const isDarkThemeSignal = computed(readIsDarkTheme);
