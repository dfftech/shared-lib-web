// browser-language.ts
// The languages the user's browser / operating system asks for, and the best match in a language list.
//
//   navigator.languages = ["fr-CA", "fr", "en-US"]   +  list en-US, fr-FR, ar-SA   ->  "fr-FR"
//
// Order of the browser codes: navigator.languages, navigator.language, then the Intl locale (system setting).
// A code matches exactly (case does not matter), else by its base language ("fr-CA" or "fr" -> "fr-FR").

import type { LanguageOption } from "../interfaces/ui-config.ts";

const CODE_SEPARATOR = "-";

/** Adds a code once (codes like "fr_CA" become "fr-CA"). */
function addCode(codes: string[], code: string | undefined): void {
  if (!code) {
    return;
  }
  const normalizedCode = code.replace("_", CODE_SEPARATOR);
  const isAdded = codes.includes(normalizedCode);
  if (!isAdded) {
    codes.push(normalizedCode);
  }
}

/** The system locale from Intl ("" when it is not available). */
function readIntlLocale(): string {
  if (typeof Intl === "undefined") {
    return "";
  }
  const dateFormat = new Intl.DateTimeFormat();
  const options = dateFormat.resolvedOptions();
  return options.locale;
}

/** The language codes the browser / system prefers, best first. [] when there is no browser. */
export function readBrowserLanguageCodes(): string[] {
  const codes: string[] = [];
  if (typeof navigator === "undefined") {
    return codes;
  }
  const preferredCodes = navigator.languages ?? [];
  for (const code of preferredCodes) {
    addCode(codes, code);
  }
  addCode(codes, navigator.language);
  const intlLocale = readIntlLocale();
  addCode(codes, intlLocale);
  return codes;
}

/** The base language of a code: "fr-CA" -> "fr". */
function toBaseLanguage(code: string): string {
  const parts = code.split(CODE_SEPARATOR);
  const baseLanguage = parts[0] ?? "";
  return baseLanguage.toLowerCase();
}

/** The list code that equals the code (any case). */
function findExactCode(code: string, languages: LanguageOption[]): string | undefined {
  const lowerCode = code.toLowerCase();
  for (const language of languages) {
    const lowerListCode = language.code.toLowerCase();
    if (lowerListCode === lowerCode) {
      return language.code;
    }
  }
  return undefined;
}

/** The first list code with the same base language ("fr" -> "fr-FR"). */
function findBaseLanguageCode(code: string, languages: LanguageOption[]): string | undefined {
  const baseLanguage = toBaseLanguage(code);
  for (const language of languages) {
    const listBaseLanguage = toBaseLanguage(language.code);
    if (listBaseLanguage === baseLanguage) {
      return language.code;
    }
  }
  return undefined;
}

/**
 * The best list code for the browser codes: for each browser code (best first) an exact match, else the same base
 * language. undefined when nothing matches.
 */
export function matchLanguageCode(browserCodes: string[], languages: LanguageOption[]): string | undefined {
  for (const browserCode of browserCodes) {
    const exactCode = findExactCode(browserCode, languages);
    if (exactCode) {
      return exactCode;
    }
    const baseLanguageCode = findBaseLanguageCode(browserCode, languages);
    if (baseLanguageCode) {
      return baseLanguageCode;
    }
  }
  return undefined;
}
