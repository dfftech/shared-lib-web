// translator.ts
// A small translation engine (no react-i18next).
//
//   t("nav.users")                    -> looks up { "nav": { "users": "..." } }
//   t("greeting", { name: "Asha" })   -> "Hello {{name}}" becomes "Hello Asha"
//
// Locale files have at most ONE sublevel: "key" or "group.key" ({ "user": { "title": "..." } }).
// Deeper keys ("user.role.admin") are not looked up; use "role.admin" or "user.roleAdmin" instead.
//
// Search order: current language -> fallback language -> package defaults -> the key itself.

import { ConstValue } from "dff-util";
import type { TranslateParams } from "../interfaces/ui-context.ts";
import type { LocaleMessages } from "../interfaces/ui-config.ts";
import { fallbackTranslationSignal, translationSignal } from "../state/signals.ts";
import { DEFAULT_CONST_MESSAGES, DEFAULT_UI_MESSAGES } from "./default-messages.ts";

const PLACEHOLDER_PATTERN = /\{\{\s*(\w+)\s*\}\}/g;

/** The deepest key: "group.key" (one sublevel). */
export const MAX_KEY_PARTS = 2;

/**
 * Finds a text in a messages object by a key: "key" or "group.key" (one sublevel only).
 * Returns undefined when not found or when the key is deeper ("a.b.c").
 */
export function lookupMessage(messages: LocaleMessages, key: string): string | undefined {
  const directValue = messages[key];
  if (typeof directValue === "string") {
    return directValue;
  }
  const keyParts = key.split(ConstValue.PERIOD);
  if (keyParts.length !== MAX_KEY_PARTS) {
    return undefined;
  }
  const groupName = keyParts[0] ?? ConstValue.EMPTY;
  const itemName = keyParts[1] ?? ConstValue.EMPTY;
  const group = messages[groupName];
  const isGroup = typeof group === "object" && group !== null;
  if (!isGroup) {
    return undefined;
  }
  const value = group[itemName];
  return typeof value === "string" ? value : undefined;
}

/** The keys of a locale file that are deeper than "group.key" (they are never shown). [] when the file is fine. */
export function findDeepLocaleKeys(messages: LocaleMessages): string[] {
  const deepKeys: string[] = [];
  const groupEntries = Object.entries(messages);
  for (const [groupName, group] of groupEntries) {
    if (typeof group !== "object" || group === null) {
      continue;
    }
    const itemEntries = Object.entries(group);
    for (const [itemName, value] of itemEntries) {
      if (typeof value === "object" && value !== null) {
        deepKeys.push(`${groupName}.${itemName}.*`);
      }
    }
  }
  return deepKeys;
}

/** Replaces {{name}} placeholders with values from params. Unknown placeholders stay as they are. */
export function interpolate(text: string, params: TranslateParams | undefined): string {
  if (!params) {
    return text;
  }
  let result = text;
  const matches = text.matchAll(PLACEHOLDER_PATTERN);
  for (const match of matches) {
    const placeholder = match[0];
    const paramName = match[1] ?? ConstValue.EMPTY;
    const paramValue = params[paramName];
    if (paramValue === undefined) {
      continue;
    }
    const replacement = String(paramValue);
    result = result.replace(placeholder, replacement);
  }
  return result;
}

/** Finds the text for a key in all sources, in order. */
export function findMessage(key: string): string | undefined {
  const currentMessages = translationSignal.value;
  const currentText = lookupMessage(currentMessages, key);
  if (currentText !== undefined) {
    return currentText;
  }
  const fallbackMessages = fallbackTranslationSignal.value;
  const fallbackText = lookupMessage(fallbackMessages, key);
  if (fallbackText !== undefined) {
    return fallbackText;
  }
  const uiText = lookupMessage(DEFAULT_UI_MESSAGES, key);
  if (uiText !== undefined) {
    return uiText;
  }
  const constText = lookupMessage(DEFAULT_CONST_MESSAGES, key);
  return constText;
}

/**
 * Translates a key into the current language.
 * Returns the key itself when no text exists, so plain text can also be passed.
 */
export function translate(key: string, params?: TranslateParams): string {
  const message = findMessage(key);
  const text = message ?? key;
  const finalText = interpolate(text, params);
  return finalText;
}
