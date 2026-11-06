// layout-choice.ts
// The example shows both ways to use the optional app shell:
//   "single" -> <AppLayout> from shared-lib-web/layout (everything ready-made)
//   "main"   -> main-layout.tsx (MainLayout): a layout this project builds itself from Header and SidebarNav
//   "aside"  -> <AsideLayout> from shared-lib-web/layout (no header, side menu only, no mega menu)
// The choice is kept in AppStorage under LAYOUT_CHOICE (one of the localStorage preference keys).
import { signal } from "@preact/signals-react";
import { AppStorage, LAYOUT_CHOICE } from "shared-lib-web";
import type { MouseEvent } from "react";

export type LayoutChoice = "single" | "main" | "aside";


/** Current choice. Read from storage on first use (after the config is saved). */
export const layoutChoiceSignal = signal<LayoutChoice>("single");

/** "main" or "aside" as they are, anything else is "single". */
export function readLayoutChoice(value: string | null | undefined): LayoutChoice {
  if (value === "main" || value === "aside") {
    return value;
  }
  return "single";
}

/** Reads the saved choice (call once the provider has saved the config). */
export function restoreLayoutChoice(): void {
  const storedChoice = AppStorage.getText(LAYOUT_CHOICE);
  layoutChoiceSignal.value = readLayoutChoice(storedChoice);
}

/** Settings buttons carry "single", "main" or "aside" in data-value. */
export function handleLayoutChoiceClick(event: MouseEvent<HTMLButtonElement>): void {
  const button = event.currentTarget;
  const choice = readLayoutChoice(button.dataset.value);
  layoutChoiceSignal.value = choice;
  AppStorage.setData(LAYOUT_CHOICE, choice);
}
