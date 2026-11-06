// language-service.ts
// Languages that come from the backend at runtime, separate from config.ts (like the menu: nav).
//
//   <SharedWebUiProvider config={config} lang={langResponse}>   // null first, the reply later
//   setLanguages(langResponse);                                 // or call it yourself
//
// langResponse is the backend reply { data: [...], meta } or only the list.
// Texts load from config.loadLocale(code): locales/en-US.json, locales/ar-SA.json ...
// When the reply arrives: the current language stays if it is in the list (and the user picked it),
// otherwise the language marked isDefault (else config.defaultLanguage, else the first) is loaded.

import { applyLanguage, readDefaultLanguage, readIsLanguageChosen } from "../i18n/locale-service.ts";
import type { LangSource } from "../interfaces/app-types.ts";
import { findLanguageOption } from "../i18n/direction.ts";
import { readDefaultLanguageCode, toLanguageOptions } from "../utils/language-util.ts";
import { languagesSignal, localeSignal, uiConfigSignal } from "./signals.ts";

/** The reply last applied by registerLanguages (undefined = none yet). */
let appliedLangSource: LangSource | null | undefined = undefined;

/** true when the code is in the current language list. */
export function isLanguageListed(languageCode: string | undefined): boolean {
  if (!languageCode) {
    return false;
  }
  const languages = languagesSignal.peek();
  const language = findLanguageOption(languages, languageCode);
  return Boolean(language);
}

/** The language to switch to after a new list: backend default, config default, or the first one. */
export function readLanguageAfterUpdate(source: LangSource): string | undefined {
  const languages = languagesSignal.peek();
  const currentCode = localeSignal.peek();
  const isCurrentListed = isLanguageListed(currentCode);
  const isChosen = readIsLanguageChosen();
  if (isCurrentListed && isChosen) {
    return undefined;
  }
  const backendDefault = readDefaultLanguageCode(source);
  const config = uiConfigSignal.peek();
  const configDefault = readDefaultLanguage(config);
  const firstLanguage = languages[0];
  const candidates = [backendDefault, configDefault, firstLanguage?.code];
  for (const candidate of candidates) {
    const isListed = isLanguageListed(candidate);
    if (isListed) {
      return candidate === currentCode ? undefined : candidate;
    }
  }
  return undefined;
}

/** Shows the backend languages in the switchers and TypeLang, and switches language when needed. */
export function setLanguages(source: LangSource): void {
  appliedLangSource = source;
  const languages = toLanguageOptions(source);
  languagesSignal.value = languages;
  const nextCode = readLanguageAfterUpdate(source);
  if (nextCode) {
    void applyLanguage(nextCode, false);
  }
}

/**
 * Used by <SharedWebUiProvider lang={...}>. Applies the value only when it changed.
 *   undefined / null -> keep config.languages (or no list yet); texts of config.defaultLanguage still load
 *   reply / list     -> show it (a new reply replaces the list)
 */
export function registerLanguages(source: LangSource | null | undefined): void {
  if (source === undefined || source === null || source === appliedLangSource) {
    return;
  }
  setLanguages(source);
}

/** Forgets the applied reply so the next registerLanguages() applies it again (used when the config changes). */
export function forgetAppliedLanguages(): void {
  appliedLangSource = undefined;
}
