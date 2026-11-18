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
import { uiConfigSignal } from "./signals.ts";
import { AppStorage } from "../utils/app-storage.ts";
import { LAYOUT_CHOICE } from "../utils/storage-keys.ts";

export type LayoutChoice = "app" | "aside";

/** The current layout choice ("aside" until a saved one is read). */
export const layoutChoiceSignal = signal<LayoutChoice>("aside");

/** Keeps a valid choice; missing or invalid values use the configured default. */
export function toLayoutChoice(value: string | null | undefined, defaultChoice: LayoutChoice = "aside"): LayoutChoice {
  return value === "app" || value === "aside" ? value : defaultChoice;
}

/** Reads the saved choice into layoutChoiceSignal (not saved again). */
export function applySavedLayoutChoice(): void {
  const savedValue = AppStorage.getText(LAYOUT_CHOICE);
  const defaultChoice = uiConfigSignal.peek()?.layout?.defaultLayout ?? "aside";
  const choice = toLayoutChoice(savedValue, defaultChoice);
  if (choice !== layoutChoiceSignal.peek()) {
    layoutChoiceSignal.value = choice;
  }
}

/** Picks a layout: saved as LAYOUT_CHOICE; the shell and every MFE on the page follow at once. */
export function changeLayoutChoice(choice: LayoutChoice): void {
  layoutChoiceSignal.value = choice;
  AppStorage.setData(LAYOUT_CHOICE, choice);
}
