// lang-field.ts
// Shared logic of the multi-language fields (TypeLang and TypeLangMarkdown).
// The form value is one object per field: { en: "Hello", fr: "Bonjour", ar: "مرحبا" }.
// Languages come from config.languages; the current language is shown first.
// The translate button next to another language fills it from the current language
// using dff-util CallLangText.

import { CallLangText, ConstKeys, ConstValue } from "dff-util";
import type { MouseEvent } from "react";
import { translate } from "../i18n/translator.ts";
import type { LanguageOption } from "../interfaces/ui-config.ts";
import { ShowToast } from "../state/toast-service.ts";
import { readFieldBinding, translatingFieldPathSignal } from "./field-registry.ts";

/** Puts the current language first, then the others in config order. */
export function orderLanguagesForEditing(languages: LanguageOption[], currentCode: string): LanguageOption[] {
  const orderedLanguages: LanguageOption[] = [];
  const otherLanguages: LanguageOption[] = [];
  for (const language of languages) {
    if (language.code === currentCode) {
      orderedLanguages.push(language);
    } else {
      otherLanguages.push(language);
    }
  }
  return [...orderedLanguages, ...otherLanguages];
}

/** Full path of one language inside a multi-language field: ("title", "fr") -> "title.fr". */
export function readLanguageFieldPath(fieldName: string, languageCode: string): string {
  return `${fieldName}${ConstValue.PERIOD}${languageCode}`;
}

/**
 * Translate button handler. The button carries:
 *   data-source-path  field to read   data-source-lang  its language
 *   data-target-path  field to fill   data-target-lang  its language
 */
export async function handleTranslateClick(event: MouseEvent<HTMLButtonElement>): Promise<void> {
  const button = event.currentTarget;
  const sourcePath = button.dataset.sourcePath ?? ConstValue.EMPTY;
  const targetPath = button.dataset.targetPath ?? ConstValue.EMPTY;
  const sourceLanguage = button.dataset.sourceLang ?? ConstValue.EMPTY;
  const targetLanguage = button.dataset.targetLang ?? ConstValue.EMPTY;
  const sourceBinding = readFieldBinding(sourcePath);
  const targetBinding = readFieldBinding(targetPath);
  if (!sourceBinding || !targetBinding) {
    return;
  }
  const sourceValue = sourceBinding.value ?? ConstValue.EMPTY;
  const sourceText = String(sourceValue);
  const trimmedText = sourceText.trim();
  if (trimmedText.length === 0) {
    return;
  }
  translatingFieldPathSignal.value = targetPath;
  try {
    const translatedText = await CallLangText(sourceText, sourceLanguage, targetLanguage);
    targetBinding.onChange(translatedText);
  } catch {
    const message = translate(ConstKeys.WENT_WRONG);
    ShowToast(message, "warning");
  } finally {
    translatingFieldPathSignal.value = ConstValue.EMPTY;
  }
}

/** Click handler wrapper that does not return a promise (for onClick). */
export function handleTranslateButtonClick(event: MouseEvent<HTMLButtonElement>): void {
  void handleTranslateClick(event);
}
