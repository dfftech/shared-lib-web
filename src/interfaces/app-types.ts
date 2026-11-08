// app-types.ts
// Shared TypeScript types that apps used to copy into utils/services/app.types.ts.
// Request/response types (ResponseType, SearchType, OptionType ...) come from dff-util.

import type { ScreenPermissions } from "./ui-config.ts";

/** A text in several languages: { "en-US": "Hello", "hi-IN": "नमस्ते" }. Used by TypeLang, TypeLangMd and trans(). */
export type TranslationType<TLanguageCode extends string = string> = Partial<Record<TLanguageCode, string>>;

/** What the user may do on one screen (name + full permissions). */
export interface ScreenAccessType extends Required<ScreenPermissions> {
  name: string;
}

/** The signed-in user (fields both admin and dealer apps use; add your own with an intersection type). */
export interface AuthUser {
  id?: string;
  email?: string;
  name?: string;
  mobile?: string;
  /** Profile picture URL. */
  pic?: string;
  persona?: string;
  roles?: string[];
}

/** A menu node as returned by the backend (menu access / role menus). Both permission styles are accepted. */
export interface MenuAccessType {
  id?: string;
  menuId?: string;
  /** Default name (English). */
  name: string;
  /** Name per language. */
  nameLang?: Record<string, string>;
  /** Route path. */
  href?: string;
  /** lucide icon name. */
  icon?: string;
  /** Short description (shown in the mega menu). */
  description?: string;
  /** Permissions as an object ... */
  permissions?: ScreenPermissions;
  /** ... or as flat flags. */
  read?: boolean;
  create?: boolean;
  update?: boolean;
  delete?: boolean;
  /** Lower numbers come first. */
  priority?: number;
  /** "link" or "group". */
  type?: string;
  /** Id of the parent group (informational). */
  menuGroupId?: string;
  /** Persona the menu belongs to, for example "admin" (informational). */
  persona?: string;
  /** false hides the menu. */
  active?: boolean;
  children?: MenuAccessType[];
}

/** Backend reply that wraps the menus: { data: [...], meta: {...} }. */
export interface MenuResponseType {
  data: MenuAccessType[];
  meta?: Record<string, unknown>;
}

/** Menus as the backend sends them: the full reply or only the list. */
export type MenuSource = MenuResponseType | MenuAccessType[];

/** How backend menus become navigation items (config.navOptions). */
export interface MenuOptions {
  /**
   * Ids of container groups whose children move to the top level (for example ["ADMIN_ROOT"]).
   * Default: groups named "Root" and ids that end with "_ROOT".
   */
  rootMenuIds?: string[];
  /** false keeps root groups as normal groups. Default true. */
  isRootFlattened?: boolean;
}

/** One language as the backend sends it. The code may be in code, langCode, languageCode or id. */
export interface LanguageRowType {
  code?: string;
  langCode?: string;
  languageCode?: string;
  /** The code as sor /load/LANG sends it: { "key": "en-US", "label": "English", "locale": "English", "disabled": false }. */
  key?: string;
  id?: string;
  /** Name shown in the switcher (usually in that language, "Français"). */
  name?: string;
  label?: string;
  nameLang?: Record<string, string>;
  /** The language's own name ("Français", "हिन्दी"); shown when label and name are missing. */
  locale?: string;
  /** Flag emoji or short text. */
  flag?: string;
  /** "ltr" or "rtl". When missing: rtl for ar, he, fa, ur. */
  direction?: string;
  dir?: string;
  /** The default language of the app. */
  isDefault?: boolean;
  default?: boolean;
  /** false hides the language. */
  active?: boolean;
  /** true hides the language (sor /load/LANG). */
  disabled?: boolean;
  /** Lower numbers come first. */
  priority?: number;
}

/** Backend reply that wraps the languages: { data: [...], meta: {...} }. */
export interface LangResponseType {
  data: LanguageRowType[];
  meta?: Record<string, unknown>;
}

/** Languages as the backend sends them: the full reply or only the list. */
export type LangSource = LangResponseType | LanguageRowType[];

/** One branch (store) as the backend sends it. Only id and name are needed; the other names are read too. */
export interface BranchRowType {
  id?: string;
  branchId?: string;
  code?: string;
  /** Name shown in the switcher. */
  name?: string;
  branchName?: string;
  label?: string;
  /** Name per language ({ "en-US": "...", "fr-FR": "..." }), shown with trans(). */
  nameLang?: Record<string, string>;
  /** The default branch: selected when the user has no saved branch yet. */
  isDefault?: boolean;
  default?: boolean;
  /** true shows the branch greyed out; it can not be selected. */
  disabled?: boolean;
  isDisabled?: boolean;
  /** false hides the branch. */
  active?: boolean;
  /** Lower numbers come first. */
  priority?: number;
}

/** Backend reply that wraps the branches: { data: [...], meta: {...} }. */
export interface BranchResponseType {
  data: BranchRowType[];
  meta?: Record<string, unknown>;
}

/** Branches as the backend sends them: the full reply or only the list. */
export type BranchSource = BranchResponseType | BranchRowType[];

/** A branch in the switcher. */
export interface BranchOption {
  id: string;
  name: string;
  nameLang?: Record<string, string>;
  isDefault: boolean;
  /** Shown but can not be selected. */
  isDisabled: boolean;
}
