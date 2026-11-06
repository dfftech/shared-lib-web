// translator.ts
// A small translation engine (no react-i18next).
//
//   t("nav.users")                    -> looks up { "nav": { "users": "..." } }
//   t("greeting", { name: "Asha" })   -> "Hello {{name}}" becomes "Hello Asha"
//
// Search order: current language -> fallback language -> package defaults -> the key itself.

import { ConstValue } from "dff-util";
import type { TranslateParams } from "../interfaces/ui-context.ts";
import type { LocaleMessages } from "../interfaces/ui-config.ts";
import { fallbackTranslationSignal, translationSignal } from "../state/signals.ts";
import { DEFAULT_CONST_MESSAGES, DEFAULT_UI_MESSAGES } from "./default-messages.ts";

const PLACEHOLDER_PATTERN = /\{\{\s*(\w+)\s*\}\}/g;

/** Finds a text in a messages object by a dotted key. Returns undefined when not found. */
export function lookupMessage(messages: LocaleMessages, key: string): string | undefined {
  const directValue = messages[key];
  if (typeof directValue === "string") {
    return directValue;
  }
  const keyParts = key.split(ConstValue.PERIOD);
  let currentValue: string | LocaleMessages | undefined = messages;
  for (const keyPart of keyParts) {
    const isGroup = typeof currentValue === "object" && currentValue !== null;
    if (!isGroup) {
      return undefined;
    }
    const group = currentValue as LocaleMessages;
    currentValue = group[keyPart];
  }
  if (typeof currentValue === "string") {
    return currentValue;
  }
  return undefined;
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
