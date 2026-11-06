// option-util.ts
// Ready-made OptionType lists from dff-util data, for TypeSelect / TypeList / TypeFilter.
//
//   const countryOptions = readCountryOptions();     // 🇮🇳 India ...
//   const telCodeOptions = readTelCodeOptions();     // 🇮🇳 +91 ...
//   const languageOptions = readLanguageOptions();   // हिन्दी (Hindi) ...

import { Countries, languages, type OptionType } from "dff-util";

/** One option per country: key = country code ("IN"), label = name, icon = flag. */
export function readCountryOptions(): OptionType[] {
  const options: OptionType[] = [];
  for (const country of Countries) {
    const option: OptionType = { key: country.code, label: country.name, icon: country.flag };
    options.push(option);
  }
  return options;
}

/**
 * One option per country phone code (optionally only the given country codes, for example ["CA", "US"]): key = country code ("IN"), label = "+91 India", icon = flag.
 * The key is the country code because several countries share a phone code (+1). Read the number with readTelCode("IN").
 */
export function readTelCodeOptions(countryCodes: string[] = []): OptionType[] {
  const options: OptionType[] = [];
  const hasFilter = countryCodes.length > 0;
  for (const country of Countries) {
    const isWanted = !hasFilter || countryCodes.includes(country.code);
    if (!isWanted) {
      continue;
    }
    const telCode = `+${country.telCode}`;
    const option: OptionType = { key: country.code, label: `${telCode} ${country.name}`, icon: country.flag };
    options.push(option);
  }
  return options;
}

/** One option per language: key = "hi-IN", label = "हिन्दी (Hindi)". */
export function readLanguageOptions(): OptionType[] {
  const options: OptionType[] = [];
  for (const language of languages) {
    const option: OptionType = { key: language.lang, label: `${language.locale} (${language.name})` };
    options.push(option);
  }
  return options;
}

/** Phone code of a country: readTelCode("IN") -> "+91". Empty text when unknown. */
export function readTelCode(countryCode: string): string {
  for (const country of Countries) {
    if (country.code === countryCode) {
      return `+${country.telCode}`;
    }
  }
  return "";
}

/** Reads the first text-like field from a record. */
function readFirstText(record: Record<string, unknown>, fieldNames: string[]): string {
  for (const fieldName of fieldNames) {
    const fieldValue = record[fieldName];
    const isText = typeof fieldValue === "string" || typeof fieldValue === "number";
    if (isText && String(fieldValue).length > 0) {
      return String(fieldValue);
    }
  }
  return "";
}

/**
 * Turns backend rows (AppHttp.Load results) into OptionType[].
 * key: key | value | code | id     label: label | name | value     lang: nameLang | labelLang
 * Rows with active === false are skipped.
 */
export function toOptionTypes(rows: unknown[]): OptionType[] {
  const options: OptionType[] = [];
  for (const row of rows) {
    if (!row || typeof row !== "object") {
      continue;
    }
    const record = row as Record<string, unknown>;
    if (record.active === false) {
      continue;
    }
    const key = readFirstText(record, ["key", "value", "code", "id"]);
    const label = readFirstText(record, ["label", "name", "value", "key"]);
    const langValue = record.nameLang ?? record.labelLang;
    const lang = langValue && typeof langValue === "object" ? (langValue as Record<string, string>) : undefined;
    const option: OptionType = { key: key, label: label, disabled: record.disabled === true, lang: lang };
    options.push(option);
  }
  return options;
}

/** Reads the row list of a response: response.data (array) or the response itself (array). */
export function readResponseRows(response: unknown): unknown[] {
  if (Array.isArray(response)) {
    return response;
  }
  if (response && typeof response === "object") {
    const data = (response as Record<string, unknown>).data;
    if (Array.isArray(data)) {
      return data;
    }
  }
  return [];
}
