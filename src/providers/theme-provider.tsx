// theme-provider.tsx
// Applies the saved (or default) DaisyUI theme before the first paint
// and keeps <html data-theme lang dir> in sync. Used inside SharedWebUiProvider.

import { useLayoutEffect, type ReactNode } from "react";
import { RUN_ONCE, initializeThemeOnMount } from "./provider-effects.ts";

export interface ThemeProviderProps {
  children?: ReactNode;
}

export function ThemeProvider(props: ThemeProviderProps) {
  useLayoutEffect(initializeThemeOnMount, RUN_ONCE);
  return <>{props.children}</>;
}
