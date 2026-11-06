// locale-service.ts
// Loads locale JSON files lazily and switches the language.
//
//   await changeLanguage("ar-SA");  -> loads ar-SA.json, sets <html lang="ar-SA" dir="rtl">, saves to localStorage
//
// The loader is the language's own load() or config.loadLocale(code) (locales/{code}.json).
// The languages are config.languages or the backend list (languagesSignal). Loaded files are cached.

import type { LanguageOption, LocaleMessages, LocaleModule, UiConfig } from "../interfaces/ui-config.ts";
import {
  fallbackTranslationSignal,
  isTranslationReadySignal,
  languagesSignal,
  localeSignal,
  translationSignal,
  uiConfigSignal,
} from "../state/signals.ts";
import { AppStorage } from "../utils/app-storage.ts";
import { LANG } from "../utils/storage-keys.ts";
import { findLanguageOption } from "./direction.ts";

const UI_CONFIG_MISSING = "shared-lib-web: config is missing. Wrap your app in <SharedWebUiProvider config={config}>.";

const loadedMessagesCache = new Map<string, LocaleMessages>();

/** true when the user picked a language (now or on an earlier visit). Then a backend default does not override it. */
let isLanguageChosen = false;

/** Returns the active config or throws a clear error when SharedWebUiProvider is missing. */
export function readActiveConfig(): UiConfig {
  const config = uiConfigSignal.value;
  if (!config) {
    throw new Error(UI_CONFIG_MISSING);
  }
  return config;
}

/** Takes the messages out of a JSON module ({ default: {...} }) or returns them as they are. */
export function unwrapLocaleModule(localeModule: LocaleModule): LocaleMessages {
  const hasDefaultExport = "default" in localeModule && typeof localeModule.default === "object";
  if (hasDefaultExport) {
    const moduleWithDefault = localeModule as { default: LocaleMessages };
    return moduleWithDefault.default;
  }
  return localeModule as LocaleMessages;
}

/** true when the language may be used: it is in the list, or no list is known yet. */
export function isLanguageAvailable(languageCode: string): boolean {
  const languages = languagesSignal.peek();
  if (languages.length === 0) {
    return true;
  }
  const language = findLanguageOption(languages, languageCode);
  return Boolean(language);
}

/** Loads the locale module of a code: the language's load(), else config.loadLocale(code). undefined = no loader. */
export function runLocaleLoader(languageCode: string): Promise<LocaleModule> | undefined {
  const languages = languagesSignal.peek();
  const language: LanguageOption | undefined = findLanguageOption(languages, languageCode);
  if (language?.load) {
    return language.load();
  }
  const config = uiConfigSignal.peek();
  const loadLocale = config?.loadLocale;
  if (!loadLocale) {
    return undefined;
  }
  return loadLocale(languageCode);
}

/** Loads (or reads from cache) the messages of one language. undefined when it cannot be loaded. */
export async function loadLocaleMessages(languageCode: string): Promise<LocaleMessages | undefined> {
  const cachedMessages = loadedMessagesCache.get(languageCode);
  if (cachedMessages) {
    return cachedMessages;
  }
  const loading = runLocaleLoader(languageCode);
  if (!loading) {
    return undefined;
  }
  try {
    const localeModule = await loading;
    const messages = unwrapLocaleModule(localeModule);
    loadedMessagesCache.set(languageCode, messages);
    return messages;
  } catch {
    return undefined;
  }
}

/** Clears the cache (used by tests). */
export function clearLocaleCache(): void {
  loadedMessagesCache.clear();
}

/** true when the user picked a language (it is not changed to the backend default then). */
export function readIsLanguageChosen(): boolean {
  return isLanguageChosen;
}

/** Language used when the app sets none (config.defaultLanguage missing). */
export const DEFAULT_LANGUAGE = "en-US";

/** config.defaultLanguage, or "en-US" when it is not set. */
export function readDefaultLanguage(config: UiConfig | null | undefined): string {
  return config?.defaultLanguage || DEFAULT_LANGUAGE;
}

/** Picks the language to start with: the saved one if it may be used, else the default. */
export function readInitialLanguageCode(config: UiConfig): string {
  const storedCode = AppStorage.getText(LANG);
  if (storedCode) {
    const isStoredAvailable = isLanguageAvailable(storedCode);
    if (isStoredAvailable) {
      return storedCode;
    }
  }
  const defaultLanguage = readDefaultLanguage(config);
  const isDefaultAvailable = isLanguageAvailable(defaultLanguage);
  if (isDefaultAvailable) {
    return defaultLanguage;
  }
  const languages = languagesSignal.peek();
  const firstLanguage = languages[0];
  return firstLanguage ? firstLanguage.code : defaultLanguage;
}

/** Loads the fallback language messages into fallbackTranslationSignal. */
export async function loadFallbackMessages(config: UiConfig): Promise<void> {
  const fallbackCode = config.fallbackLanguage ?? readDefaultLanguage(config);
  const fallbackMessages = await loadLocaleMessages(fallbackCode);
  if (fallbackMessages) {
    fallbackTranslationSignal.value = fallbackMessages;
  }
}

/**
 * Loads a language and makes it current. Returns false when it is not available or cannot be loaded.
 * shouldSave = true when the user picked it (saved to localStorage).
 */
export async function applyLanguage(languageCode: string, shouldSave: boolean): Promise<boolean> {
  const isAvailable = isLanguageAvailable(languageCode);
  if (!isAvailable) {
    return false;
  }
  const messages = await loadLocaleMessages(languageCode);
  if (!messages) {
    return false;
  }
  translationSignal.value = messages;
  localeSignal.value = languageCode;
  isTranslationReadySignal.value = true;
  if (shouldSave) {
    isLanguageChosen = true;
    AppStorage.setData(LANG, languageCode);
  }
  return true;
}

/**
 * Switches the app language (language switcher, settings).
 * Unknown codes are ignored. The choice is saved to localStorage.
 */
export async function changeLanguage(languageCode: string): Promise<void> {
  readActiveConfig();
  await applyLanguage(languageCode, true);
}

/** Loads the saved (or default) language and the fallback language. Called once by TranslationProvider. */
export async function initializeLanguage(): Promise<void> {
  const config = readActiveConfig();
  const storedCode = AppStorage.getText(LANG);
  isLanguageChosen = Boolean(storedCode);
  await loadFallbackMessages(config);
  const languageCode = readInitialLanguageCode(config);
  const isApplied = await applyLanguage(languageCode, false);
  if (isApplied) {
    return;
  }
  const defaultLanguage = readDefaultLanguage(config);
  const isDefaultApplied = await applyLanguage(defaultLanguage, false);
  if (!isDefaultApplied) {
    isTranslationReadySignal.value = true;
  }
}
