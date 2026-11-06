// overlays.page.ts — TypeScript only: open/close state and handlers of the overlays showcase.
import { signal } from "@preact/signals-react";
import { ShowToast, readDataValue, translate, type ToastType } from "shared-lib-web";
import type { OptionType } from "dff-util";
import type { MouseEvent } from "react";

export const isModalOpen = signal(false);
export const drawerSide = signal<"" | "start" | "end">("");
export const isConfirmOpen = signal(false);
export const lastAction = signal("");

export function openModal(): void {
  isModalOpen.value = true;
}
export function closeModal(): void {
  isModalOpen.value = false;
}
export function openDrawerEnd(): void {
  drawerSide.value = "end";
}
export function openDrawerStart(): void {
  drawerSide.value = "start";
}
export function closeDrawer(): void {
  drawerSide.value = "";
}
export function openConfirm(): void {
  isConfirmOpen.value = true;
}
export function closeConfirm(): void {
  isConfirmOpen.value = false;
}

export function handleConfirm(): void {
  isConfirmOpen.value = false;
  const message = translate("demo.confirmed");
  ShowToast(message, "success");
}

/** Toast buttons carry the toast type in data-value. */
export function handleToastClick(event: MouseEvent<HTMLButtonElement>): void {
  const toastType = readDataValue(event) as ToastType;
  const message = translate("demo.toastMessage");
  ShowToast(message, toastType);
}

/** Dropdown items carry their key in data-value. */
export function handleActionSelect(event: MouseEvent<HTMLButtonElement>): void {
  lastAction.value = readDataValue(event);
}

export const actionItems: OptionType[] = [
  { key: "edit", label: "Edit", icon: "Pencil", lang: { fr: "Modifier", ar: "تعديل" } },
  { key: "copy", label: "Duplicate", icon: "Copy", lang: { fr: "Dupliquer", ar: "نسخ" } },
  { key: "archive", label: "Archive", icon: "Archive", disabled: true },
  { key: "delete", label: "Delete", icon: "Trash2", lang: { fr: "Supprimer", ar: "حذف" } },
];
