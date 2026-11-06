// translation-provider.tsx
// Loads the saved (or default) locale JSON file and shows a loader until it is ready.
// Used inside SharedWebUiProvider.

import { useSignals } from "@preact/signals-react/runtime";
import { useEffect, type ReactNode } from "react";
import { isTranslationReadySignal } from "../state/signals.ts";
import { PageLoader } from "../components/page-loader.tsx";
import { RUN_ONCE, initializeLanguageOnMount } from "./provider-effects.ts";

export interface TranslationProviderProps {
  children?: ReactNode;
  /** Shown while the first locale file loads. Default: a centred spinner. */
  loadingFallback?: ReactNode;
}

export function TranslationProvider(props: TranslationProviderProps) {
  useSignals();
  const { children, loadingFallback } = props;
  useEffect(initializeLanguageOnMount, RUN_ONCE);

  const isReady = isTranslationReadySignal.value;
  if (!isReady) {
    const defaultFallback = <PageLoader />;
    return <>{loadingFallback ?? defaultFallback}</>;
  }
  return <>{children}</>;
}
