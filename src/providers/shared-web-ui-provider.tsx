// shared-web-ui-provider.tsx
// The single entry point of the app. Wrap your app once:
//
//   <SharedWebUiProvider type="spa" config={config}>      type: "spa" (default) | "shell" | "mfe"
//     <App />
//   </SharedWebUiProvider>
//
// Menu, languages and branches come from the backend through config loaders (the provider calls them itself):
//   loadSupportLanguages, loadBranches, loadMenuNavigation  (like loadThemes)
//   lang on start; branch and nav after sign in (removed on sign out). Type "mfe" calls only lang.
// By hand (no loaders): setLanguages(reply), setBranches(reply), setMenu(reply).
//
// It provides: config context, theme, translations, query parameter sync and toasts.
// There is no router: the current page is ?page=... (or the path for pageMode "path" / type "shell").

import { useLayoutEffect, type ReactNode } from "react";
import { startScrollListener } from "../components/scroll-to-top.tsx";
import { ToastContainer } from "../components/toast-container.tsx";
import { TopProgress } from "../components/top-progress.tsx";
import { MediaViewer } from "../types/media-viewer.tsx";
import { UiContext, readContextState } from "../context/ui-context.ts";
import type { AppType, UiConfig } from "../interfaces/ui-config.ts";
import { startQueryParamSync } from "../query/query-param.ts";
import { startApiLoading } from "../state/api-loader.ts";
import { applySavedLayoutChoice } from "../state/layout-choice-service.ts";
import { startPreferenceSync } from "../state/preference-sync.ts";
import { startSessionSync } from "../state/auth-service.ts";
import { appTypeSignal } from "../state/signals.ts";
import { startEscapeListener } from "../utils/event-util.ts";
import { RUN_ONCE } from "./provider-effects.ts";
import { ThemeProvider } from "./theme-provider.tsx";
import { TranslationProvider } from "./translation-provider.tsx";
import { registerUiConfig } from "./register-config.ts";

export interface SharedWebUiProviderProps {
  /** The app configuration (usually imported from config.ts). Backend loaders: loadSupportLanguages, loadBranches, loadMenuNavigation. */
  config: UiConfig;
  /**
   * What the app is: "spa" (default), "shell" (hosts microfrontends; pages are paths by default) or "mfe"
   * (a microfrontend: page layouts only; no menu / branch calls; appName, logos, homePath, branchLabel unused).
   */
  type?: AppType;
  /** Your app. */
  children?: ReactNode;
  /** Shown while the first locale file loads. */
  loadingFallback?: ReactNode;
}

/** Saves the app type (before the config, so the page mode is right on the first render). */
export function registerAppType(type: AppType): void {
  if (appTypeSignal.peek() !== type) {
    appTypeSignal.value = type;
  }
}

export function SharedWebUiProvider(props: SharedWebUiProviderProps) {
  const { config, type = "spa", children, loadingFallback } = props;
  registerAppType(type);
  registerUiConfig(config);
  useLayoutEffect(startQueryParamSync, RUN_ONCE);
  useLayoutEffect(startEscapeListener, RUN_ONCE);
  useLayoutEffect(startScrollListener, RUN_ONCE);
  useLayoutEffect(startPreferenceSync, RUN_ONCE);
  useLayoutEffect(startSessionSync, RUN_ONCE);
  useLayoutEffect(applySavedLayoutChoice, RUN_ONCE);
  useLayoutEffect(startApiLoading, RUN_ONCE);
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
