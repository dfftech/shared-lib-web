// language-switcher.tsx
// Dropdown that lists the languages (config.languages or the lang reply) and switches the language.
// Hidden while there is no list (or only one language).
//   <LanguageSwitcher />              -> 🌐 EN          (compact: header)
//   <LanguageSwitcher isFullName />   -> 🌐 English     (login / AuthLayout: the user may not know the codes)

import { readBaseLanguageCode } from "../i18n/direction.ts";
import type { MouseEvent, ReactElement } from "react";
import { useUi } from "../context/use-ui.ts";
import { changeLanguage } from "../i18n/locale-service.ts";
import type { LanguageOption } from "../interfaces/ui-config.ts";
import { TypeIcon } from "../types/type.icon.ts";

/** Switches to the language stored in the button's data-language-code attribute. */
export function handleLanguageButtonClick(event: MouseEvent<HTMLButtonElement>): void {
  const button = event.currentTarget;
  const languageCode = button.dataset.languageCode;
  if (!languageCode) {
    return;
  }
  void changeLanguage(languageCode);
}

/** Returns "🇫🇷 Français" or just "Français" when no flag is set. */
export function readLanguageLabel(language: LanguageOption): string {
  if (!language.flag) {
    return language.label;
  }
  return `${language.flag} ${language.label}`;
}

/** Builds one menu entry per language. */
function buildLanguageItems(languages: LanguageOption[], activeCode: string): ReactElement[] {
  const items: ReactElement[] = [];
  for (const language of languages) {
    const isActive = language.code === activeCode;
    const label = readLanguageLabel(language);
    const item = (
      <li key={language.code}>
        <button
          type="button"
          lang={language.code}
          className={isActive ? "menu-active" : undefined}
          aria-current={isActive}
          data-language-code={language.code}
          onClick={handleLanguageButtonClick}
        >
          {label}
        </button>
      </li>
    );
    items.push(item);
  }
  return items;
}

export interface LanguageSwitcherProps {
  /** Show the full name of the current language ("English", "Français") instead of the code ("EN"). */
  isFullName?: boolean;
}

/** The button text: the language name (isFullName) or the upper-case base code ("EN"). */
function readButtonText(languages: LanguageOption[], locale: string, isFullName: boolean): string {
  if (isFullName) {
    for (const language of languages) {
      if (language.code === locale) {
        return language.label;
      }
    }
  }
  const baseCode = readBaseLanguageCode(locale);
  return baseCode.toUpperCase();
}

export function LanguageSwitcher(props: LanguageSwitcherProps = {}) {
  const { languages, locale, t } = useUi();
  const languageText = t("ui.language");
  const items = buildLanguageItems(languages, locale);
  const buttonText = readButtonText(languages, locale, props.isFullName === true);
  // No list, or only one language: nothing to switch.
  if (languages.length < 2) {
    return null;
  }

  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="btn btn-ghost btn-sm gap-1" aria-label={languageText}>
        <TypeIcon name="Globe" size={16} />
        <span className="text-xs font-semibold">{buttonText}</span>
      </div>
      <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-40 mt-2 w-48 p-2 shadow-lg">
        {items}
      </ul>
    </div>
  );
}
