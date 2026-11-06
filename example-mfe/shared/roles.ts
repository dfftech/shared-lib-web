// roles.ts — role options used by the forms and profile MFEs (labels per language code).
import type { OptionType } from "dff-util";
import { ConstKeys, RegExp } from "dff-util";

export const roleOptions: OptionType[] = [
  { key: "admin", label: "Admin", lang: { "fr-FR": "Administrateur", "ar-SA": "مسؤول", "te-IN": "నిర్వాహకుడు" } },
  { key: "editor", label: "Editor", lang: { "fr-FR": "Éditeur", "ar-SA": "محرر", "te-IN": "ఎడిటర్" } },
  { key: "viewer", label: "Viewer", lang: { "fr-FR": "Lecteur", "ar-SA": "مشاهد", "te-IN": "వీక్షకుడు" } },
];

/** Shared validation rules (dff-util ConstKeys messages, translated by the locale files). */
export const requiredRule = { required: { value: true, message: ConstKeys.REQUIRED } };
export const emailRules = {
  required: { value: true, message: ConstKeys.REQUIRED },
  pattern: { value: RegExp.EMAIL, message: ConstKeys.INVALID_EMAIL },
};
