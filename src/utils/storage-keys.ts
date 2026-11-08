// storage-keys.ts
// The AppStorage key names shared by every app (the same names the apps used in utils/services/app.storage.ts).
// AppStorage adds config.appNameKey as prefix: LANG -> "ORG-LANG".
//
//   import { AppStorage, TOKEN, BRANCH_ID } from "shared-lib-web";
//   AppStorage.setData(BRANCH_ID, branchId);
//   const token = AppStorage.getData(TOKEN);

/** Access token (sessionStorage). */
export const TOKEN = "TOKEN";
/** Random id of this browser tab (sessionStorage); AppHttp sends it as the x-session-id header. */
export const ACTIVE_SESSION_ID = "ACTIVE_SESSION_ID";
/** Signed-in user saved by startSession(). */
export const AUTH_USER = "AUTH_USER";
export const SESSION_INFO = "SESSION_INFO";
export const SCREEN_ACCESS = "SCREEN_ACCESS";
export const SCREEN_ACTION = "SCREEN_ACTION";
export const NAV = "NAV";
/** "true" when the user ticked "remember me" on the login form (localStorage, kept on log out). */
export const REMEMBER_ME = "REMEMBER_ME";
export const TRANS = "TRANS";
export const DIR = "DIR";
/** Language the user picked (localStorage, kept on log out). */
export const LANG = "LANG";
/** Theme the user picked (localStorage, kept on log out). */
export const THEME = "THEME";
/** Which app layout the user picked, for apps that offer a choice (localStorage, kept on log out). */
export const LAYOUT_CHOICE = "LAYOUT_CHOICE";
/** Menu mode the user picked: "sidebar" or "megamenu" (localStorage, kept on log out). */
export const MENU_MODE = "MENU_MODE";
/** "true" when the sidebar is collapsed to the icon rail (localStorage, kept on log out). */
export const SIDEBAR_COLLAPSED = "SIDEBAR_COLLAPSED";
export const OTP_ID = "OTP_ID";
/** Selected branch; AppHttp sends it as the x-branch-id header. */
export const BRANCH_ID = "BRANCH_ID";
export const BRANCH_NAME = "BRANCH_NAME";
/** Absolute cutoff (ISO) after which the JWT can no longer be regenerated. */
export const REGEN_EXPIRES_AT = "REGEN_EXPIRES_AT";

/** All key names in one object: StorageKeys.TOKEN, StorageKeys.LANG ... */
export const StorageKeys = {
  TOKEN: TOKEN,
  ACTIVE_SESSION_ID: ACTIVE_SESSION_ID,
  AUTH_USER: AUTH_USER,
  SESSION_INFO: SESSION_INFO,
  SCREEN_ACCESS: SCREEN_ACCESS,
  SCREEN_ACTION: SCREEN_ACTION,
  NAV: NAV,
  REMEMBER_ME: REMEMBER_ME,
  TRANS: TRANS,
  DIR: DIR,
  LANG: LANG,
  THEME: THEME,
  LAYOUT_CHOICE: LAYOUT_CHOICE,
  MENU_MODE: MENU_MODE,
  SIDEBAR_COLLAPSED: SIDEBAR_COLLAPSED,
  OTP_ID: OTP_ID,
  BRANCH_ID: BRANCH_ID,
  BRANCH_NAME: BRANCH_NAME,
  REGEN_EXPIRES_AT: REGEN_EXPIRES_AT,
} as const;

/**
 * The ONLY keys kept in localStorage (preferences; they survive log out and AppStorage.clearData keeps them).
 * Every other key (TOKEN, AUTH_USER, NAV, TRANS, BRANCH_ID ...) lives in sessionStorage.
 * A project adds its own preference keys with config.localStorageKeys.
 */
export const LOCAL_STORAGE_KEYS: string[] = [LANG, THEME, LAYOUT_CHOICE, MENU_MODE, SIDEBAR_COLLAPSED, REMEMBER_ME];

/**
 * Window event fired by AppStorage.setData when a localStorage preference is saved (detail = { key }).
 * Every copy of the library on the page listens to it (preference-sync.ts) — useful for microfrontends.
 */
export const PREFERENCE_EVENT = "shared-lib-web:preference";

/**
 * Window event fired by startSession / endSession (detail = { isSignedIn, copyId }). Every OTHER copy of the library
 * on the page applies it (auth-service.ts) — so a sign in inside an auth microfrontend signs the shell in too.
 */
export const SESSION_EVENT = "shared-lib-web:session";

/** AppStorage prefix when config.appNameKey is missing. */
export const DEFAULT_APP_STORAGE_PREFIX = "UI";

/** Start of every window.env name: REACT_APP_ + APPNAMEKEY + _ + KEY -> REACT_APP_ORG_API_BASE_URL. */
export const ENV_NAME_START = "REACT_APP_";
