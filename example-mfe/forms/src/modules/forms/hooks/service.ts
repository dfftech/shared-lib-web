// Forms state: the last submitted values and the form reset (no HTTP here).
import { signal } from "@preact/signals-react";
import { ShowToast, translate } from "shared-lib-web";
import type { UseFormReset } from "react-hook-form";
import { getDefaultContact } from "./data.ts";
import type { ContactType } from "./types.ts";

/** id of the <form>: the HeadLayout submit button (outside the form) points at it. */
export const CONTACT_FORM_ID = "mfe-forms-form";

/** The last submitted values (shown under the form). */
export const submittedContact = signal<ContactType | null>(null);

let resetContactForm: UseFormReset<ContactType> | null = null;

/** Keeps the form's reset function, so Cancel can empty the form. */
export function setContactReset(reset: UseFormReset<ContactType>): void {
  resetContactForm = reset;
}

/** Submit: show the values and a toast (a real app saves them with a call from service-http.ts). */
export function contactSubmitted(values: ContactType): void {
  submittedContact.value = values;
  const message = translate("forms.submitted");
  ShowToast(message, "success");
}

/** Cancel: back to empty fields. */
export function contactCancel(): void {
  const defaultValues = getDefaultContact();
  resetContactForm?.(defaultValues);
  submittedContact.value = null;
}
