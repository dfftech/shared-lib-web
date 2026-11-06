// logo.ts
// Picks the logo for the current theme.

import type { UiConfig } from "../interfaces/ui-config.ts";

/** Returns logoDarkUrl on dark themes (when set), else logoUrl. */
export function readLogoUrl(config: UiConfig, isDarkTheme: boolean): string | undefined {
  if (isDarkTheme && config.logoDarkUrl) {
    return config.logoDarkUrl;
  }
  return config.logoUrl;
}
