// config.ts — ONE config shared by every MFE (import it, do not copy it).
// Same appNameKey ("ORG") in every MFE, so they all read the same localStorage keys:
//   ORG-THEME  the theme the user picked (any MFE)       ORG-LANG  the language the user picked (any MFE)
// Each MFE renders <SharedWebUiProvider config={config} nav={[]}>, which applies the saved theme and language on mount.
// No menu (nav = []): the MFEs have only page layouts; the root shell owns the top bar.

import type { LocaleModule, UiConfig } from "shared-lib-web";
import { DARK_THEMES, THEMES } from "./theme/themes.ts";

/** Key / base name shared by all MFEs: ORG-THEME, ORG-LANG ... */
export const APP_NAME_KEY = "ORG";

/** Loads shared/locales/{code}.json when that language is used. */
function loadLocale(languageCode: string): Promise<LocaleModule> {
  return import(`./locales/${languageCode}.json`);
}

export const config: UiConfig = {
  appNameKey: APP_NAME_KEY,
  appName: "app.name",
  defaultLanguage: "en-US",
  loadLocale: loadLocale,
  // A fixed language list (no backend reply needed in the MFEs).
  languages: [
    { code: "en-US", label: "English", flag: "🇺🇸" },
    { code: "fr-FR", label: "Français", flag: "🇫🇷" },
    { code: "ar-SA", label: "العربية", flag: "🇸🇦", direction: "rtl" },
    { code: "te-IN", label: "తెలుగు", flag: "🇮🇳" },
  ],
  defaultTheme: "light",
  themes: THEMES,
  darkThemes: DARK_THEMES,
  // The MFEs have no app header: no settings button, no menu.
  layout: { showMenu: false, showScrollToTop: true, toastPosition: "top-end" },
};
