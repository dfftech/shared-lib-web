// layout-choice.ts — which shell layout the user picked, shared by the shell and every MFE (each has its own copy).
//   "app"   AppLayout: header + menu (sidebar or mega menu)
//   "aside" AsideLayout: menu only, no header, no mega menu
// Saved as ORG-LAYOUT_CHOICE (a localStorage preference). Saving it fires the library's PREFERENCE_EVENT, so the
// shell switches its layout and the open MFE follows at once.

import { signal } from "@preact/signals-react";
import { AppStorage, LAYOUT_CHOICE, PREFERENCE_EVENT, isAsideLayoutSignal } from "shared-lib-web";

export type LayoutChoice = "app" | "aside";

/** The saved choice ("app" when nothing is saved). */
export function readLayoutChoice(): LayoutChoice {
  const savedChoice = AppStorage.getText(LAYOUT_CHOICE);
  return savedChoice === "aside" ? "aside" : "app";
}

/** The current choice of this bundle. */
export const layoutChoiceSignal = signal<LayoutChoice>("app");

let isSyncStarted = false;

/** Saves a choice (the settings MFE); every bundle on the page gets the PREFERENCE_EVENT. */
export function saveLayoutChoice(choice: LayoutChoice): void {
  AppStorage.setData(LAYOUT_CHOICE, choice);
}

/** Reads the saved choice into this bundle. In an MFE it also tells its library copy (HeadLayout sticks at top-0). */
export function applyLayoutChoice(): void {
  const choice = readLayoutChoice();
  layoutChoiceSignal.value = choice;
}

/** Copies the choice into isAsideLayoutSignal (MFEs only: there the shell, not the MFE, renders the layout). */
export function applyLayoutChoiceToMfe(): void {
  applyLayoutChoice();
  isAsideLayoutSignal.value = layoutChoiceSignal.peek() === "aside";
}

function handleLayoutPreference(event: Event): void {
  const detail = (event as CustomEvent<{ key?: string }>).detail;
  if (detail?.key === LAYOUT_CHOICE) {
    applyLayoutChoice();
  }
}

function handleMfeLayoutPreference(event: Event): void {
  const detail = (event as CustomEvent<{ key?: string }>).detail;
  if (detail?.key === LAYOUT_CHOICE) {
    applyLayoutChoiceToMfe();
  }
}

/** Shell: read the choice now and follow every change. Call inside SharedWebUiProvider (the storage prefix comes from its config). */
export function startLayoutChoiceSync(): void {
  applyLayoutChoice();
  if (isSyncStarted) {
    return;
  }
  isSyncStarted = true;
  window.addEventListener(PREFERENCE_EVENT, handleLayoutPreference);
}

/** MFE: read the choice now and follow every change. Call once per bundle. */
export function startMfeLayoutChoiceSync(): void {
  applyLayoutChoiceToMfe();
  if (isSyncStarted) {
    return;
  }
  isSyncStarted = true;
  window.addEventListener(PREFERENCE_EVENT, handleMfeLayoutPreference);
}
