// backend-signals.ts
// The backend inputs of the provider, as signals (config.ts passes them on):
//   loadSupportLanguages: langSignal, loadMenuNavigation: navSignal
// null = not here yet (languages: no list, menu: skeleton); a reply = shown at once. Filled by backend.service.ts.
// This file imports nothing else of the app, so config.ts can import it safely.
import { signal } from "@preact/signals-react";
import type { LangSource, MenuSource } from "shared-lib-web";

/** The supported languages (backend reply). One language here, so no language switcher is shown. */
export const langSignal = signal<LangSource | null>(null);

/** The menu of the signed-in user (backend reply). */
export const navSignal = signal<MenuSource | null>(null);
