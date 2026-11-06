// app-config.ts
// The app config as a plain object (no signal), for the non-React helpers AppHttp and AppStorage.
// <SharedWebUiProvider config={config}> saves it. Code that runs before the provider (module load,
// a service worker ...) can save it earlier:
//
//   setAppConfig(config);                  // for example in main.tsx, before createRoot(...)
//   const config = readAppConfig();        // the saved config, or null

import type { UiConfig } from "../interfaces/ui-config.ts";

let appConfig: UiConfig | null = null;

/** Saves the config for AppHttp and AppStorage. */
export function setAppConfig(config: UiConfig): void {
  appConfig = config;
}

/** The saved config, or null before setAppConfig / SharedWebUiProvider. */
export function readAppConfig(): UiConfig | null {
  return appConfig;
}
