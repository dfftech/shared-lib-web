// layout-choice-service.ts
// Which app layout the user picked — for a shell with microfrontends, where the settings MFE offers the choice and
// the shell renders the layout:
//   "app"    AppLayout: header + menu (sidebar or mega menu)
//   "aside"  AsideLayout: menu only, no header, no mega menu
//
//   changeLayoutChoice("aside");     // saves ORG-LAYOUT_CHOICE (localStorage) and fires PREFERENCE_EVENT
//   layoutChoiceSignal.value         // "app" | "aside" — every copy of the library on the page follows at once
//
// The provider reads the saved choice on mount; preference-sync.ts follows later changes (same tab and other tabs).
// An MFE has no layout of its own: it reads layoutChoiceSignal to know whether the shell shows a header.

import { signal } from "@preact/signals-react";
import { AppStorage } from "../utils/app-storage.ts";
import { LAYOUT_CHOICE } from "../utils/storage-keys.ts";

export type LayoutChoice = "app" | "aside";

/** The current layout choice ("app" until a saved one is read). */
export const layoutChoiceSignal = signal<LayoutChoice>("app");

/** "aside" stays "aside"; anything else (nothing saved, an old value) is "app". */
export function toLayoutChoice(value: string | null | undefined): LayoutChoice {
  return value === "aside" ? "aside" : "app";
}

/** Reads the saved choice into layoutChoiceSignal (not saved again). */
export function applySavedLayoutChoice(): void {
  const savedValue = AppStorage.getText(LAYOUT_CHOICE);
  const choice = toLayoutChoice(savedValue);
  if (choice !== layoutChoiceSignal.peek()) {
    layoutChoiceSignal.value = choice;
  }
}

/** Picks a layout: saved as LAYOUT_CHOICE; the shell and every MFE on the page follow at once. */
export function changeLayoutChoice(choice: LayoutChoice): void {
  layoutChoiceSignal.value = choice;
  AppStorage.setData(LAYOUT_CHOICE, choice);
}
