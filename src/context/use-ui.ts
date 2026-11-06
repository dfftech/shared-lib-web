// use-ui.ts
// The one hook every page and component uses.
//
//   const { locale, theme, direction, t, changeLanguage, changeTheme } = useUi();
//
// It subscribes the component to the signals, so it re-renders when the language or theme changes.

import { useSignals } from "@preact/signals-react/runtime";
import { useContext } from "react";
import { changeLanguage } from "../i18n/locale-service.ts";
import { translate } from "../i18n/translator.ts";
import type { UiContextValue } from "../interfaces/ui-context.ts";
import { directionSignal, isTranslationReadySignal, languagesSignal, localeSignal, themeSignal } from "../state/signals.ts";
import { changeTheme, splitThemesByMode } from "../theme/theme-service.ts";
import { UiContext } from "./ui-context.ts";

const USE_UI_OUTSIDE_PROVIDER = "shared-lib-web: useUi() must be used inside <SharedWebUiProvider config={config}>.";

export function useUi(): UiContextValue {
  useSignals();
  const contextState = useContext(UiContext);
  if (!contextState) {
    throw new Error(USE_UI_OUTSIDE_PROVIDER);
  }
  const config = contextState.config;
  const themeGroups = splitThemesByMode(config.themes);
  const uiValue: UiContextValue = {
    config: config,
    locale: localeSignal.value,
    theme: themeSignal.value,
    direction: directionSignal.value,
    isReady: isTranslationReadySignal.value,
    languages: languagesSignal.value,
    themes: config.themes,
    lightThemes: themeGroups.lightThemes,
    darkThemes: themeGroups.darkThemes,
    t: translate,
    changeLanguage: changeLanguage,
    changeTheme: changeTheme,
  };
  return uiValue;
}
