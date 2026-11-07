// forms.service.ts — state and handlers of the forms MFE.
import { signal } from "@preact/signals-react";
import { ShowToast, translate } from "shared-lib-web";
import type { UseFormReset } from "react-hook-form";

export interface ContactFormType {
  name: string;
  email: string;
  role: string;
  startDate: string;
  isActive: boolean;
  notes: string;
}

export const FORMS_FORM_ID = "mfe-forms-form";

export function getDefaultContact(): ContactFormType {
  return { name: "", email: "", role: "", startDate: "", isActive: true, notes: "" };
}

/** The last submitted values (shown under the form). */
export const submittedContactSignal = signal<ContactFormType | null>(null);

let resetContactForm: UseFormReset<ContactFormType> | null = null;

export function setContactReset(reset: UseFormReset<ContactFormType>): void {
  resetContactForm = reset;
}

export function handleContactSubmit(values: ContactFormType): void {
  submittedContactSignal.value = values;
  const message = translate("forms.submitted");
  ShowToast(message, "success");
}

/** Cancel: back to empty fields. */
export function handleContactCancel(): void {
  const defaultValues = getDefaultContact();
  resetContactForm?.(defaultValues);
  submittedContactSignal.value = null;
}
