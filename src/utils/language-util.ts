// language-util.ts
// Turns backend languages (LanguageRowType) into LanguageOption[] for the switchers, TypeLang and RTL.
//
//   const languages = toLanguageOptions(langResponse);   // { data: [...], meta } or the plain list
//   const defaultCode = readDefaultLanguageCode(langResponse);
//
// Usually you do not call this yourself: <SharedWebUiProvider lang={langResponse}> or setLanguages() do it.

import { ConstValue } from "dff-util";
import type { LangSource, LanguageRowType } from "../interfaces/app-types.ts";
import type { Direction, LanguageOption } from "../interfaces/ui-config.ts";

/** Reads the language list from the backend reply ({ data: [...] }) or returns the list itself. */
export function readLanguageRows(source: LangSource | null | undefined): LanguageRowType[] {
  if (!source) {
    return [];
  }
  const isList = Array.isArray(source);
  if (isList) {
    return source;
  }
  return source.data ?? [];
}

/** The language code of a row ("en-US"), from code, langCode, languageCode or id. */
export function readLanguageRowCode(row: LanguageRowType): string {
  return row.code ?? row.langCode ?? row.languageCode ?? row.id ?? ConstValue.EMPTY;
}

/** "rtl" / "ltr" from direction or dir. undefined lets the shell decide (rtl for ar, he, fa, ur). */
export function readLanguageRowDirection(row: LanguageRowType): Direction | undefined {
  const directionText = row.direction ?? row.dir;
  if (!directionText) {
    return undefined;
  }
  const lowerDirection = directionText.toLowerCase();
  if (lowerDirection === ConstValue.RTL) {
    return ConstValue.RTL as Direction;
  }
  return ConstValue.LTR as Direction;
}

/** Name shown in the switcher: label, name, nameLang in that language, or the code. */
export function readLanguageRowLabel(row: LanguageRowType, languageCode: string): string {
  const ownName = row.nameLang?.[languageCode];
  return row.label ?? row.name ?? ownName ?? languageCode;
}

/** Sort compare: lower priority first. Same priority keeps the backend order. */
export function compareLanguagePriority(first: LanguageRowType, second: LanguageRowType): number {
  const firstPriority = first.priority ?? Number.MAX_SAFE_INTEGER;
  const secondPriority = second.priority ?? Number.MAX_SAFE_INTEGER;
  return firstPriority - secondPriority;
}

/** Rows that can be shown: a code is present and active is not false. Sorted by priority. */
export function readActiveLanguageRows(source: LangSource | null | undefined): LanguageRowType[] {
  const rows = readLanguageRows(source);
  const activeRows: LanguageRowType[] = [];
  for (const row of rows) {
    const languageCode = readLanguageRowCode(row);
    const isActive = row.active !== false;
    if (languageCode.length > 0 && isActive) {
      activeRows.push(row);
    }
  }
  activeRows.sort(compareLanguagePriority);
  return activeRows;
}

/** Converts one backend language into a LanguageOption (texts load with config.loadLocale). */
export function toLanguageOption(row: LanguageRowType): LanguageOption {
  const languageCode = readLanguageRowCode(row);
  const label = readLanguageRowLabel(row, languageCode);
  const direction = readLanguageRowDirection(row);
  const option: LanguageOption = { code: languageCode, label: label };
  if (row.flag) {
    option.flag = row.flag;
  }
  if (direction) {
    option.direction = direction;
  }
  return option;
}

/** Converts the backend reply (or list) into the languages the shell offers. */
export function toLanguageOptions(source: LangSource | null | undefined): LanguageOption[] {
  const activeRows = readActiveLanguageRows(source);
  const options: LanguageOption[] = [];
  for (const row of activeRows) {
    const option = toLanguageOption(row);
    options.push(option);
  }
  return options;
}

/** The code marked isDefault (or default) in the backend list, or undefined. */
export function readDefaultLanguageCode(source: LangSource | null | undefined): string | undefined {
  const activeRows = readActiveLanguageRows(source);
  for (const row of activeRows) {
    const isDefault = row.isDefault === true || row.default === true;
    if (isDefault) {
      return readLanguageRowCode(row);
    }
  }
  return undefined;
}
