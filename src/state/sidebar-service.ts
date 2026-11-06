// sidebar-service.ts
// Opens and closes the sidebar drawer on small screens.

import type { ChangeEvent } from "react";
import { isSidebarOpenSignal } from "./signals.ts";

/** Closes the drawer (called after a menu link is clicked). */
export function closeSidebar(): void {
  isSidebarOpenSignal.value = false;
}

/** Opens or closes the drawer. */
export function toggleSidebar(): void {
  const isOpen = isSidebarOpenSignal.value;
  isSidebarOpenSignal.value = !isOpen;
}

/** Change handler for the DaisyUI drawer checkbox. */
export function handleDrawerToggleChange(event: ChangeEvent<HTMLInputElement>): void {
  const checkbox = event.currentTarget;
  isSidebarOpenSignal.value = checkbox.checked;
}
