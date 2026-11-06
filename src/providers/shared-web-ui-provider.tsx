// shared-web-ui-provider.tsx
// The single entry point of the shell. Wrap your app once:
//
//   <SharedWebUiProvider config={config}>
//     <App />
//   </SharedWebUiProvider>
//
// Menu and languages from the backend are passed separately and can change at any time
// (null first, the reply later; { data: [...], meta } or the list):
//   <SharedWebUiProvider config={config} nav={menuResponse} lang={langResponse}>
// Branches work the same way (no switcher while null or empty):
//   <SharedWebUiProvider config={config} branch={branchResponse}>   (isDefault / disabled come with the rows)
//
// It provides: config context, theme, translations, query parameter sync and toasts.
// There is no router: the current page is the ?page query parameter (openPage, setQueryParam, readQueryParam).

import { useLayoutEffect, type ReactNode } from "react";
import { startScrollListener } from "../components/scroll-to-top.tsx";
import { ToastContainer } from "../components/toast-container.tsx";
import { TopProgress } from "../components/top-progress.tsx";
import { MediaViewer } from "../types/media-viewer.tsx";
import { UiContext, readContextState } from "../context/ui-context.ts";
import type { BranchSource, LangSource, MenuSource } from "../interfaces/app-types.ts";
import type { UiConfig } from "../interfaces/ui-config.ts";
import { startQueryParamSync } from "../query/query-param.ts";
import { registerBranches } from "../state/branch-service.ts";
import { startPreferenceSync } from "../state/preference-sync.ts";
import { registerLanguages } from "../state/language-service.ts";
import { registerMenu } from "../state/menu-service.ts";
import { startEscapeListener } from "../utils/event-util.ts";
import { RUN_ONCE } from "./provider-effects.ts";
import { ThemeProvider } from "./theme-provider.tsx";
import { TranslationProvider } from "./translation-provider.tsx";
import { registerUiConfig } from "./register-config.ts";

export interface SharedWebUiProviderProps {
  /** The app configuration (usually imported from config.ts). */
  config: UiConfig;
  /**
   * Menu from the backend: the reply { data: [...], meta } or the list. Replaces config.navigation.
   * null = still loading (menu skeleton). Leave it out to use config.navigation.
   */
  nav?: MenuSource | null;
  /**
   * Languages from the backend: the reply { data: [...], meta } or the list. Replaces config.languages.
   * null = not here yet (config.defaultLanguage is shown meanwhile). Texts load with config.loadLocale(code).
   */
  lang?: LangSource | null;
  /**
   * Branches from the backend: the reply { data: [...], meta } or the list ({ id, name, nameLang?, isDefault?, disabled? }).
   * The row with isDefault is selected when the user has none saved; disabled rows can not be selected.
   * null or [] = no branch switcher. The selected branch is sent as x-branch-id by AppHttp.
   */
  branch?: BranchSource | null;
  /** Your app. */
  children?: ReactNode;
  /** Shown while the first locale file loads. */
  loadingFallback?: ReactNode;
}

/** Applies the backend inputs (each only when it changed). */
export function applyProviderInputs(
  nav: MenuSource | null | undefined,
  lang: LangSource | null | undefined,
  branch: BranchSource | null | undefined,
): void {
  registerMenu(nav);
  registerLanguages(lang);
  registerBranches(branch);
}

export function SharedWebUiProvider(props: SharedWebUiProviderProps) {
  const { config, nav, lang, branch, children, loadingFallback } = props;
  registerUiConfig(config);
  // nav / lang / branch are written to signals AFTER the render (layout effect, still before the paint), so no other
  // component is updated while this one renders (React warns about that).
  const applyInputs = applyProviderInputs.bind(null, nav, lang, branch);
  const inputs = [nav, lang, branch];
  useLayoutEffect(applyInputs, inputs);
  useLayoutEffect(startQueryParamSync, RUN_ONCE);
  useLayoutEffect(startEscapeListener, RUN_ONCE);
  useLayoutEffect(startScrollListener, RUN_ONCE);
  useLayoutEffect(startPreferenceSync, RUN_ONCE);
  const contextState = readContextState(config);

  return (
    <UiContext.Provider value={contextState}>
      <ThemeProvider>
        <TranslationProvider loadingFallback={loadingFallback}>
          {children}
          <ToastContainer />
          <TopProgress />
          <MediaViewer />
        </TranslationProvider>
      </ThemeProvider>
    </UiContext.Provider>
  );
}
