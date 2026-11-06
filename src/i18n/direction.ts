// direction.ts
// Decides if a language is written right-to-left (rtl) or left-to-right (ltr).

import { ConstValue } from "dff-util";
import type { Direction, LanguageOption } from "../interfaces/ui-config.ts";

/** Language codes written from right to left. */
export const RTL_LANGUAGE_CODES = ["ar", "he", "fa", "ur"];

/** Returns the first part of a code: "ar-SA" -> "ar". */
export function readBaseLanguageCode(languageCode: string): string {
  const codeParts = languageCode.split(ConstValue.HYPHEN);
  const baseCode = codeParts[0] ?? languageCode;
  const lowerCaseCode = baseCode.toLowerCase();
  return lowerCaseCode;
}

/** Finds a language in the config list by its code. */
export function findLanguageOption(
  languages: LanguageOption[],
  languageCode: string,
): LanguageOption | undefined {
  for (const language of languages) {
    if (language.code === languageCode) {
      return language;
    }
  }
  return undefined;
}

/** Returns "rtl" or "ltr" for a language code. A direction set in the config always wins. */
export function resolveDirection(languageCode: string, languages: LanguageOption[]): Direction {
  const language = findLanguageOption(languages, languageCode);
  if (language?.direction) {
    return language.direction;
  }
  const baseCode = readBaseLanguageCode(languageCode);
  const isRtl = RTL_LANGUAGE_CODES.includes(baseCode);
  if (isRtl) {
    return ConstValue.RTL as Direction;
  }
  return ConstValue.LTR as Direction;
}
