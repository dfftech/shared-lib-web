// Forms default values.
import type { ContactType } from "./types.ts";

export const contactInitValues: ContactType = { name: "", email: "", role: "", startDate: "", isActive: true, notes: "" };

export function getDefaultContact(): ContactType {
  return { ...contactInitValues };
}
