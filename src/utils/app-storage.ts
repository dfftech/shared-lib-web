// app-storage.ts
// Prefixed browser storage for app data (token, session info, branch, preferences ...).
// The key names are the shared constants from storage-keys.ts (TOKEN, LANG, THEME, BRANCH_ID ...).
//
//   AppStorage.setData(TOKEN, token);                  // sessionStorage  "ORG-TOKEN"
//   AppStorage.setData(THEME, "org-dark");             // localStorage    "ORG-THEME" (a preference key)
//   const token = AppStorage.getData(TOKEN);
//   AppStorage.removeData(BRANCH_ID);                  // removed from both storages
//   AppStorage.clearData();                            // log out: keeps LANG, THEME, MENU_MODE ...
//   const apiUrl = AppStorage.envData("API_BASE_URL"); // window.env.REACT_APP_ORG_API_BASE_URL
//
// Prefix: config.appNameKey ("ORG" -> "ORG-TOKEN"). Objects are saved as JSON.
// Where a value goes depends ONLY on the key:
//   localStorage   LANG, THEME, LAYOUT_CHOICE, MENU_MODE, SIDEBAR_COLLAPSED, REMEMBER_ME (+ config.localStorageKeys)
//   sessionStorage everything else (TOKEN, AUTH_USER, SESSION_INFO, NAV, TRANS, DIR, BRANCH_ID ...)

import { ConstValue } from "dff-util";
import { readAppConfig } from "./app-config.ts";
import { DEFAULT_APP_STORAGE_PREFIX, ENV_NAME_START, LOCAL_STORAGE_KEYS, PREFERENCE_EVENT } from "./storage-keys.ts";

/** Any value that can be saved. */
export type StoredValue = string | number | boolean | null | object;

/** window with the runtime settings object (window.env, set by env.js in the deployed app). */
type WindowWithEnv = Window & { env?: Record<string, string | undefined> };

/** Prefix of every key: config.appNameKey ("ORG"), default "UI". */
export function readAppStoragePrefix(): string {
  const config = readAppConfig();
  return config?.appNameKey || DEFAULT_APP_STORAGE_PREFIX;
}

/** Start of the window.env names of this app: "REACT_APP_ORG_" (or "REACT_APP_" without appNameKey). */
export function readEnvPrefix(): string {
  const config = readAppConfig();
  const appNameKey = config?.appNameKey;
  return buildEnvPrefix(appNameKey);
}

/** "ORG" -> "REACT_APP_ORG_" ("REACT_APP_" without a key). */
export function buildEnvPrefix(appNameKey: string | undefined): string {
  if (!appNameKey) {
    return ENV_NAME_START;
  }
  const upperAppNameKey = appNameKey.toUpperCase();
  return `${ENV_NAME_START}${upperAppNameKey}${ConstValue.UNDERSCORE}`;
}

/** Returns localStorage or sessionStorage, or null when not available. */
function readStorage(isLocal: boolean): Storage | null {
  try {
    const hasWindow = typeof window !== "undefined";
    if (!hasWindow) {
      return null;
    }
    return isLocal ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

/** Adds the app prefix to a key: "TOKEN" -> "AS-TOKEN". */
export function readPrefixedKey(key: string): string {
  const prefix = readAppStoragePrefix();
  return `${prefix}${ConstValue.HYPHEN}${key}`;
}

/** The keys kept in localStorage: the library preferences plus config.localStorageKeys. */
export function readLocalStorageKeys(): string[] {
  const config = readAppConfig();
  const projectKeys = config?.localStorageKeys ?? [];
  return [...LOCAL_STORAGE_KEYS, ...projectKeys];
}

/** true when the key lives in localStorage (a preference); every other key is in sessionStorage. */
export function isLocalStorageKey(key: string): boolean {
  const localKeys = readLocalStorageKeys();
  return localKeys.includes(key);
}

/** Turns a value into text for storage. */
function toStoredText(value: StoredValue): string {
  if (typeof value === "string") {
    return value;
  }
  return JSON.stringify(value);
}

/** Turns stored text back into a value (JSON objects and arrays are parsed). */
function fromStoredText(text: string): StoredValue {
  const firstCharacter = text.charAt(0);
  const looksLikeJson = firstCharacter === "{" || firstCharacter === "[";
  if (!looksLikeJson) {
    return text;
  }
  try {
    const parsedValue = JSON.parse(text) as StoredValue;
    return parsedValue;
  } catch {
    return text;
  }
}

/** Saves a value: localStorage for preference keys, sessionStorage for every other key. */
function setData(key: string, value: StoredValue): void {
  const isLocalKey = isLocalStorageKey(key);
  const storage = readStorage(isLocalKey);
  if (!storage) {
    return;
  }
  const prefixedKey = readPrefixedKey(key);
  const storedText = toStoredText(value);
  try {
    storage.setItem(prefixedKey, storedText);
  } catch {
    // Storage is full or blocked: the value is not saved.
  }
  if (isLocalKey) {
    notifyPreferenceSaved(key);
  }
}

/** Tells every library copy on the page (microfrontends) that a preference was saved. */
function notifyPreferenceSaved(key: string): void {
  const eventInit = { detail: { key: key } };
  const preferenceEvent = new CustomEvent(PREFERENCE_EVENT, eventInit);
  window.dispatchEvent(preferenceEvent);
}

/** Reads a value from the storage of its key. Returns null when nothing is saved. */
function getData(key: string): StoredValue {
  const isLocalKey = isLocalStorageKey(key);
  const storage = readStorage(isLocalKey);
  if (!storage) {
    return null;
  }
  const prefixedKey = readPrefixedKey(key);
  const storedText = storage.getItem(prefixedKey);
  if (storedText === null) {
    return null;
  }
  return fromStoredText(storedText);
}

/** Reads a value as text ("" when nothing is saved). */
function getText(key: string): string {
  const storedValue = getData(key);
  if (storedValue === null) {
    return ConstValue.EMPTY;
  }
  return toStoredText(storedValue);
}

/** Removes a value from both storages. */
function removeData(key: string): void {
  const prefixedKey = readPrefixedKey(key);
  const storages = [readStorage(true), readStorage(false)];
  for (const storage of storages) {
    storage?.removeItem(prefixedKey);
  }
}

/** Prefixed keys that clearData keeps: the preferences and keepKeys. */
function readKeptPrefixedKeys(keepKeys: string[]): string[] {
  const localKeys = readLocalStorageKeys();
  const allKeepKeys = [...localKeys, ...keepKeys];
  const keptPrefixedKeys: string[] = [];
  for (const keepKey of allKeepKeys) {
    const prefixedKeepKey = readPrefixedKey(keepKey);
    keptPrefixedKeys.push(prefixedKeepKey);
  }
  return keptPrefixedKeys;
}

/**
 * Log out: removes every value with the app prefix from both storages.
 * Keeps the preferences (LANG, THEME, LAYOUT_CHOICE, MENU_MODE, SIDEBAR_COLLAPSED, REMEMBER_ME and
 * config.localStorageKeys) and the keys passed in keepKeys.
 */
function clearData(keepKeys: string[] = []): void {
  const storages = [readStorage(true), readStorage(false)];
  const prefix = readAppStoragePrefix();
  const prefixWithHyphen = `${prefix}${ConstValue.HYPHEN}`;
  const keptPrefixedKeys = readKeptPrefixedKeys(keepKeys);
  for (const storage of storages) {
    if (!storage) {
      continue;
    }
    const storageKeys = Object.keys(storage);
    for (const storageKey of storageKeys) {
      const isAppKey = storageKey.startsWith(prefixWithHyphen);
      const isKept = keptPrefixedKeys.includes(storageKey);
      if (isAppKey && !isKept) {
        storage.removeItem(storageKey);
      }
    }
  }
}

/**
 * Removes app values from localStorage that do not belong there (for example a TOKEN or NAV saved by an older
 * version), so localStorage only holds the preference keys. Called once when the provider gets its config.
 */
function cleanLocalStorage(): void {
  const storage = readStorage(true);
  if (!storage) {
    return;
  }
  const prefix = readAppStoragePrefix();
  const prefixWithHyphen = `${prefix}${ConstValue.HYPHEN}`;
  const keptPrefixedKeys = readKeptPrefixedKeys([]);
  const storageKeys = Object.keys(storage);
  for (const storageKey of storageKeys) {
    const isAppKey = storageKey.startsWith(prefixWithHyphen);
    const isKept = keptPrefixedKeys.includes(storageKey);
    if (isAppKey && !isKept) {
      storage.removeItem(storageKey);
    }
  }
}

/**
 * Reads a runtime setting from window.env (set by env.js when the app is deployed).
 * The name is REACT_APP_ + config.appNameKey + _ + KEY: envData("api_base_url") -> window.env.REACT_APP_ORG_API_BASE_URL.
 * Returns null when it is not set.
 */
function envData(key: string): string | null {
  const config = readAppConfig();
  const appNameKey = config?.appNameKey;
  return readEnvData(appNameKey, key);
}

/**
 * Reads window.env.REACT_APP_<APPNAMEKEY>_<KEY> without needing the saved config, so a project's config.ts can use it:
 *   const API_BASE_URL = readEnvData(APP_NAME_KEY, "API_BASE_URL") ?? "/api";
 * Returns null when it is not set.
 */
export function readEnvData(appNameKey: string | undefined, key: string): string | null {
  const hasWindow = typeof window !== "undefined";
  if (!hasWindow) {
    return null;
  }
  const envPrefix = buildEnvPrefix(appNameKey);
  const upperKey = key.toUpperCase();
  const envName = `${envPrefix}${upperKey}`;
  const windowWithEnv = window as WindowWithEnv;
  const envValue = windowWithEnv.env?.[envName];
  return envValue || null;
}

export const AppStorage = {
  getData: getData,
  getText: getText,
  setData: setData,
  removeData: removeData,
  clearData: clearData,
  cleanLocalStorage: cleanLocalStorage,
  envData: envData,
};
