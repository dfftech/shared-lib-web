// Forms option lists (with their loading signals).
import { signal } from "@preact/signals-react";
import type { OptionType } from "dff-util";

/** The role options (labels per language code). A backend list would use AppHttp.Load("ROLES") here. */
const ROLE_ROWS: OptionType[] = [
  { key: "admin", label: "Admin", lang: { "fr-FR": "Administrateur", "ar-SA": "مسؤول", "te-IN": "నిర్వాహకుడు" } },
  { key: "editor", label: "Editor", lang: { "fr-FR": "Éditeur", "ar-SA": "محرر", "te-IN": "ఎడిటర్" } },
  { key: "viewer", label: "Viewer", lang: { "fr-FR": "Lecteur", "ar-SA": "مشاهد", "te-IN": "వీక్షకుడు" } },
];

export const roleIsLoading = signal(false);
export const roleOptions = signal<OptionType[]>([]);

/** Fills roleOptions (once is enough; calling again does no harm). */
export function roleLoadCall(): void {
  roleIsLoading.value = true;
  roleOptions.value = ROLE_ROWS;
  roleIsLoading.value = false;
}
