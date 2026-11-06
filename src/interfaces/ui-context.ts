// ui-context.ts
// Shape of the value returned by useUi().

import type { Direction, LanguageOption, Theme, UiConfig } from "./ui-config.ts";

/** Values that can be put into a translated text: t("hello", { name: "Asha" }) with "Hello {{name}}". */
export type TranslateParams = Record<string, string | number>;

/** The translate function. Returns the key itself when no text is found. */
export type TranslateFunction = (key: string, params?: TranslateParams) => string;

/** Everything useUi() gives you. */
export interface UiContextValue {
  /** The config passed to <SharedWebUiProvider>. */
  config: UiConfig;
  /** Current language code, for example "en". */
  locale: string;
  /** Current DaisyUI theme. */
  theme: Theme;
  /** Current text direction. */
  direction: Direction;
  /** true when the current locale file has been loaded. */
  isReady: boolean;
  /** Languages from the config. */
  languages: LanguageOption[];
  /** Themes from the config. */
  themes: Theme[];
  /** themes without the dark ones (config order). */
  lightThemes: Theme[];
  /** the dark themes of `themes` (config.darkThemes). */
  darkThemes: Theme[];
  /** Translate a key. */
  t: TranslateFunction;
  /** Switch language (loads the locale file, sets lang/dir, saves to localStorage). */
  changeLanguage: (languageCode: string) => Promise<void>;
  /** Switch theme (sets data-theme, saves to localStorage). */
  changeTheme: (theme: Theme) => void;
}

/** What is stored in the React context: only the config. Live values come from signals. */
export interface UiContextState {
  config: UiConfig;
}
