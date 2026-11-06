// register-config.ts
// Stores the config given to <SharedWebUiProvider> (uiConfigSignal for components, setAppConfig for AppHttp /
// AppStorage) and sets up the navigation state.

import type { UiConfig } from "../interfaces/ui-config.ts";
import { restoreSession } from "../state/auth-service.ts";
import { forgetAppliedBranches } from "../state/branch-service.ts";
import { forgetAppliedLanguages } from "../state/language-service.ts";
import { forgetAppliedMenu } from "../state/menu-service.ts";
import { initializeNavigation } from "../state/navigation-service.ts";
import { languagesSignal, uiConfigSignal } from "../state/signals.ts";
import { setAppConfig } from "../utils/app-config.ts";
import { AppStorage } from "../utils/app-storage.ts";

/** Saves the config. Does nothing when the same config object is already saved. */
export function registerUiConfig(config: UiConfig): void {
  const currentConfig = uiConfigSignal.peek();
  if (currentConfig === config) {
    return;
  }
  setAppConfig(config);
  uiConfigSignal.value = config;
  languagesSignal.value = config.languages ?? [];
  forgetAppliedLanguages();
  initializeNavigation(config);
  forgetAppliedMenu();
  forgetAppliedBranches();
  AppStorage.cleanLocalStorage();
  restoreSession();
}
