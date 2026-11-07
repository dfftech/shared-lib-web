// backend-signals.ts
// The three backend inputs of the provider, as signals (config.ts passes them on):
//   loadSupportLanguages: langSignal, loadBranches: branchSignal, loadMenuNavigation: navSignal
// null = not here yet (languages: no list, branches: no switcher, menu: skeleton); a reply = shown at once.
// They are filled by backend.service.ts. This file imports nothing else, so config.ts can import it safely.
import { signal } from "@preact/signals-react";
import type { BranchSource, LangSource, MenuSource } from "shared-lib-web";

/** The supported languages (backend reply). */
export const langSignal = signal<LangSource | null>(null);

/** The branches of the signed-in user (backend reply). */
export const branchSignal = signal<BranchSource | null>(null);

/** The menu of the signed-in user (backend reply). */
export const navSignal = signal<MenuSource | null>(null);
