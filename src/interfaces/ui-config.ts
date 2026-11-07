// ui-config.ts
// The strongly typed contract between an app and the UI shell.
// An app only writes ONE object of type UiConfig (in its config.ts),
// its locale JSON files and its pages. Everything else lives in this package.

import type { LangDirType } from "dff-util";
import type { IconName } from "../types/type.icon.ts";
import type { MenuOptions } from "./app-types.ts";

/** Text direction. "ltr" = left to right, "rtl" = right to left. Same type as dff-util. */
export type Direction = LangDirType;

/** A DaisyUI theme name, for example "light", "dark", "corporate", "dracula". */
export type Theme = string;

/**
 * A custom DaisyUI theme as plain data, so it can live in a JSON file or come from an API:
 *   { "name": "org-light", "isDark": false, "variables": { "color-primary": "oklch(55.8% 0.154 249.1)" } }
 * The library turns it into [data-theme="org-light"] { color-scheme: light; --color-primary: ...; }.
 */
export interface CustomTheme {
  /** data-theme name: lowercase letters, digits and "-", for example "org-light". */
  name: Theme;
  /** true for a dark theme (color-scheme: dark, dark logo, dark markdown editor). Default false. */
  isDark?: boolean;
  /**
   * DaisyUI theme variables, with or without "--" (the same names as in a DaisyUI theme):
   * color-base-100/200/300, color-base-content, color-primary, color-primary-content, color-secondary(-content),
   * color-accent(-content), color-neutral(-content), color-info/success/warning/error(-content),
   * radius-selector, radius-field, radius-box, size-selector, size-field, border, depth, noise.
   */
  variables: Record<string, string>;
}

/** Texts per language code for a loadLocale signal: { "en-US": {...}, "fr-FR": {...} }; null = no texts. */
export type LocaleBundle = Record<string, LocaleMessages | null>;

/** What a themes loader may return: the list, or a JSON module with a default export. */
export type CustomThemesModule = CustomTheme[] | { default: CustomTheme[] };

/**
 * Loads the custom themes lazily (like loadLocale), from a JSON file or an API:
 *   function loadThemes(): Promise<CustomThemesModule> { return import("./theme/org-themes.json"); }
 *   async function loadThemes(): Promise<CustomThemesModule> { const reply = await fetch("/themes.json"); return reply.json(); }
 */
export type ThemesLoader = () => Promise<CustomThemesModule>;

/**
 * Translations for one language.
 * Values are text or nested groups: { "nav": { "home": "Home" } } is read with t("nav.home").
 */
export interface LocaleMessages {
  [key: string]: string | LocaleMessages;
}

/** What a locale loader may return: the messages, or a JSON module with a default export. */
export type LocaleModule = LocaleMessages | { default: LocaleMessages };

/**
 * Loads one locale JSON file lazily.
 * Example in config.ts:  function loadEnglish(): Promise<LocaleModule> { return import("./locales/en.json"); }
 */
export type LocaleLoader = () => Promise<LocaleModule>;

/**
 * Loads the locale JSON file of any language code. Used when the languages come from the backend.
 * Example in config.ts:  function loadLocale(code: string): Promise<LocaleModule> { return import(`./locales/${code}.json`); }
 */
export type LocaleCodeLoader = (languageCode: string) => Promise<LocaleModule>;

/** One language offered in the language switcher. */
export interface LanguageOption {
  /** Language code, for example "en-US", "fr-FR", "ar-SA". Used for <html lang> and the locale file name. */
  code: string;
  /** Name shown in the switcher, in that language (for example "Français"). */
  label: string;
  /** Optional flag or short text shown before the label. */
  flag?: string;
  /** Force a direction. When missing, ar, he, fa and ur are "rtl" and every other code is "ltr". */
  direction?: Direction;
  /** Loads the locale JSON file for this language. Default: config.loadLocale(code). */
  load?: LocaleLoader;
}

/** What the current user may do on a screen. Missing values count as true. */
export interface ScreenPermissions {
  read?: boolean;
  create?: boolean;
  update?: boolean;
  delete?: boolean;
}

/** One entry in the navigation (sidebar and mega menu). */
export interface NavItem {
  /** Unique id. */
  id: string;
  /** Translation key (or plain text) of the visible label, for example "nav.users". */
  labelKey: string;
  /** Label per language from the backend, for example { en: "Users", fr: "Utilisateurs" }. Wins over labelKey. */
  labelLang?: Record<string, string>;
  /** Translation key of a short description, shown in the mega menu. */
  descriptionKey?: string;
  /** Route path, for example "/users". Leave empty for a group that only has children. */
  path?: string;
  /** lucide-react icon name shown with TypeIcon, for example "Users". */
  icon?: IconName;
  /** Permissions for this screen. read: false hides the item and blocks the page (RequireAccess). */
  permissions?: ScreenPermissions;
  /** Child items shown as a sub menu (sidebar) or a column (mega menu). */
  children?: NavItem[];
}

/**
 * How the main navigation is shown.
 * - "sidebar": left drawer (collapses to an icon rail on desktop)
 * - "megamenu": top bar with full-width mega menu panels (drawer on small screens)
 */
export type NavigationMode = "sidebar" | "megamenu";

/** Layout settings. */
export interface LayoutConfig {
  /** Menu mode at start: "sidebar" or "megamenu". Default "sidebar". The user's pick is saved as MENU_MODE. */
  menuMode?: NavigationMode;
  /** Show the menu (sidebar / mega menu bar) at start. Change it at runtime with setMenuVisible(). Default true. */
  showMenu?: boolean;
  /** Allow collapsing the sidebar to an icon rail on desktop. Default true. */
  isSidebarCollapsible?: boolean;
  /** "inline": language and theme switchers in the header. "menu": one settings button that opens them. Default "inline". */
  headerSettings?: "inline" | "menu";
  /** Where toasts appear. Default "top-end". */
  toastPosition?: ToastPosition;
  /** Show a "scroll to top" button on long pages. Default true. */
  showScrollToTop?: boolean;
  /** Query parameter that holds the current page (menu href without the leading slash): ?page=profiles. Default "page". */
  pageParam?: string;
  /**
   * Where the current page lives in the address:
   *   "query"            http://host/?page=profiles   (default for type "spa")
   *   "path"             http://host/profiles         (default for type "shell"; the server must answer every path
   *                                                    with index.html)
   */
  pageMode?: PageMode;
}

/**
 * What the app is, passed as <SharedWebUiProvider type="...">:
 *   "spa"    a normal single app (default): layouts, menu, login, ?page=... pages
 *   "shell"  the root app that hosts microfrontends: like "spa", but pages are paths by default (/settings)
 *   "mfe"    a microfrontend inside a shell: page layouts only. The shell owns the menu, branches, logos and app name,
 *            so loadMenuNavigation / loadBranches are not called and appName, logoUrl, logoDarkUrl, homePath and
 *            branchLabel are not used.
 */
export type AppType = "spa" | "shell" | "mfe";

/** Anything with a reactive value: a @preact/signals signal or computed (read only). */
export interface ValueSignal<TValue = unknown> {
  readonly value: TValue;
  peek(): TValue;
  subscribe(listener: (value: TValue) => void): () => void;
}

/**
 * A backend source of the config, one of:
 *   - your function that returns the reply (like loadThemes / loadLocale)
 *   - a URL / path (sent with AppHttp.Get; a path gets the base URL, see AppHttp)
 *   - a signal you fill yourself: null = not here yet (menu: skeleton, branches: no switcher), then the reply;
 *     every new value is applied at once (the provider does not call anything for a signal)
 * Replies may be { data: [...], meta } or the list.
 */
export type ApiSource = string | (() => Promise<unknown>) | ValueSignal<unknown>;

/** "query" = ?page=profiles, "path" = /profiles. */
export type PageMode = "query" | "path";

/** Toast corner / edge. "end" is right in LTR and left in RTL. */
export type ToastPosition = "top-start" | "top-center" | "top-end" | "bottom-start" | "bottom-center" | "bottom-end";

/** Backend settings used by AppHttp and the session. */
export interface HttpConfig {
  /** API base URL, for example "https://api.example.com/api" or "/api". window.env API_BASE_URL wins when set. */
  baseUrl?: string;
  /** Where the browser goes after endSession() (log out), for example "/login" or "https://sso.example.com/logout". */
  logoutUrl?: string;
  /** AppStorage key of the access token. Default "TOKEN". */
  tokenKey?: string;
  /** Extra headers sent with every request. */
  headers?: Record<string, string>;
  /** URL (or path, added to the base URL) of the options loader used by AppHttp.Load(id) — the id is added: `${loadUrl}/${id}`. Default: "/load". */
  loadUrl?: string;
  /** Show the top progress bar during requests. Default true. */
  showProgress?: boolean;
}

/** The whole configuration of an app. */
export interface UiConfig {
  /**
   * Key (base name) of the app — the apps' ENV_BASE_NAME / APP_ID, for example "ORG".
   *   - AppStorage keys:  ORG-TOKEN, ORG-LANG, ORG-THEME ...
   *   - window.env names: REACT_APP_ORG_API_BASE_URL (AppStorage.envData("API_BASE_URL"))
   */
  appNameKey: string;
  /**
   * Loads the supported languages (backend list): called once when the provider mounts, like loadThemes.
   * On an error the default language stays. By hand: setLanguages(reply).
   */
  loadSupportLanguages?: ApiSource;
  /**
   * Loads the branches of the signed-in user: called after sign in (and on start when a session is restored),
   * BEFORE loadMenuNavigation, so the menu request already sends x-branch-id. Removed on sign out.
   * Not called for type "mfe". By hand: setBranches(reply).
   */
  loadBranches?: ApiSource;
  /**
   * Loads the menu of the signed-in user: called after sign in (and on start when a session is restored); the menu
   * shows a skeleton until it answers, an error shows an empty menu. Removed on sign out. Not called for type "mfe".
   * Without it the menu is config.navigation. By hand: setMenuLoading() -> setMenu(reply).
   */
  loadMenuNavigation?: ApiSource;
  /** Label shown in the header, sidebar and login: t(appName), so plain text or a translation key. Default: appNameKey. */
  appName?: string;
  /** Optional logo image URL (light themes). */
  logoUrl?: string;
  /** Optional logo image URL used on dark themes. Default: logoUrl. */
  logoDarkUrl?: string;
  /**
   * Static language list. Not needed when the languages come from the backend:
   * pass them with config.loadSupportLanguages or setLanguages(langResponse).
   */
  languages?: LanguageOption[];
  /**
   * The texts of a language: a function loadLocale(code) (lazy JSON / API), or a SIGNAL with a LocaleBundle
   * ({ "en-US": {...} }) that the app fills — the library adds the codes it needs to requestedLocalesSignal and
   * waits; fillLocaleBundle(signal, loader) does the filling.
   */
  loadLocale?: LocaleCodeLoader | ValueSignal<LocaleBundle | null>;
  /**
   * Language code used on the first visit (nothing saved; a backend isDefault language still wins).
   * Optional: without it the browser / system language (navigator.languages matched to the list,
   * "fr-CA" -> "fr-FR"), else "en-US". Keys missing in a language are shown in defaultLanguage (else "en-US").
   */
  defaultLanguage?: string;
  /**
   * DaisyUI themes offered in the theme switcher. Optional, default: all 35 DaisyUI themes
   * (enable them in your CSS: @plugin "daisyui" { themes: all; }). The customThemes are always listed first.
   */
  themes?: Theme[];
  /**
   * Your own themes as data (for example imported from a JSON file); no CSS file needed. Themes that arrive later
   * (fetched JSON) go through setCustomThemes(json).
   */
  customThemes?: CustomTheme[];
  /**
   * Custom themes loaded when the provider mounts (JSON file or API), like loadLocale — or a SIGNAL with the themes
   * (null = not here yet; every new value replaces them). They are added to customThemes (same name: the loaded one
   * wins). A saved custom theme stays on screen while they load.
   */
  loadThemes?: ThemesLoader | ValueSignal<CustomThemesModule | null>;
  /**
   * Theme used on the first visit (nothing saved yet). Optional: without it the browser preference decides,
   * "dark" when it prefers a dark colour scheme, otherwise "light".
   */
  defaultTheme?: Theme;
  /**
   * Which of the themes are dark (used for dark logos and the markdown editor). Default: the DaisyUI dark themes.
   * Custom themes with isDark: true are always added.
   */
  darkThemes?: Theme[];
  /**
   * Static navigation items. Optional when the menu comes from the backend:
   * pass it with config.loadMenuNavigation or setMenu(menuResponse).
   */
  navigation?: NavItem[];
  /** How backend menus are converted (root group flattening). */
  navOptions?: MenuOptions;
  /** Layout settings. */
  layout?: LayoutConfig;
  /** Home page: shown when ?page is missing, used by the logo. Default "/". */
  homePath?: string;
  /** Backend settings for AppHttp and the session. */
  http?: HttpConfig;
  /**
   * Extra AppStorage keys of the project that belong in localStorage (preferences kept on log out).
   * The library keys LANG, THEME, LAYOUT_CHOICE, MENU_MODE, SIDEBAR_COLLAPSED and REMEMBER_ME always are;
   * everything else is saved in sessionStorage.
   */
  localStorageKeys?: string[];
  /**
   * Title of the branch switcher (header dropdown and settings dialog): a translation key or a text, shown with t().
   * Default "ui.branch" ("Branch").
   */
  branchLabel?: string;
}
