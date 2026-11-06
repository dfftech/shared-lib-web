// lang-util.ts
// Helpers for texts that come with their own translations, for example records from the backend:
//   { name: "Users", nameLang: { en: "Users", fr: "Utilisateurs", "hi-IN": "उपयोगकर्ता" } }
//
//   trans(item.nameLang, item.name)   -> text in the current language, or the default text

import { ConstValue } from "dff-util";
import { readBaseLanguageCode } from "../i18n/direction.ts";
import { translate } from "../i18n/translator.ts";
import type { NavItem } from "../interfaces/ui-config.ts";
import { localeSignal } from "../state/signals.ts";

/** A text in several languages: { en: "Hello", fr: "Bonjour" }. */
export type TranslationRecord = Record<string, string>;

/** true when the text has at least one non-space character. */
function hasText(text: string | undefined): text is string {
  if (text === undefined || text === null) {
    return false;
  }
  const trimmedText = text.trim();
  return trimmedText.length > 0;
}

/**
 * Picks the text for the current language from a translation record.
 * Tries the exact code ("fr-CA"), then the base code ("fr"), then a key starting with the base code ("fr-FR"),
 * then the default text.
 */
export function trans(textByLanguage: TranslationRecord | undefined, defaultText: string = ConstValue.EMPTY): string {
  if (!textByLanguage) {
    return defaultText;
  }
  const languageCode = localeSignal.value;
  const exactText = textByLanguage[languageCode];
  if (hasText(exactText)) {
    return exactText;
  }
  const baseCode = readBaseLanguageCode(languageCode);
  const baseText = textByLanguage[baseCode];
  if (hasText(baseText)) {
    return baseText;
  }
  const recordCodes = Object.keys(textByLanguage);
  for (const recordCode of recordCodes) {
    const recordBaseCode = readBaseLanguageCode(recordCode);
    const recordText = textByLanguage[recordCode];
    if (recordBaseCode === baseCode && hasText(recordText)) {
      return recordText;
    }
  }
  return defaultText;
}

/** Visible label of a nav item: labelLang for the current language, else the translated labelKey. */
export function readNavLabel(item: NavItem): string {
  const translatedKey = translate(item.labelKey);
  const label = trans(item.labelLang, translatedKey);
  return label;
}
