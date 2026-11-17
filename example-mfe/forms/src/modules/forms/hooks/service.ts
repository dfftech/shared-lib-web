// Forms state: the last submitted values and the form reset (no HTTP here).
import { signal } from "@preact/signals-react";
import { ShowToast, openOtpModal, translate, type OtpVerifiedResult } from "shared-lib-web";
import type { UseFormReturn } from "react-hook-form";
import { getDefaultContact } from "./data.ts";
import type { ContactType } from "./types.ts";

/** id of the <form>: the HeadLayout submit button (outside the form) points at it. */
export const CONTACT_FORM_ID = "mfe-forms-form";

/** The last submitted values (shown under the form). */
export const submittedContact = signal<ContactType | null>(null);

/** The last verified one-time code of the email (shown under the form). */
export const verifiedEmailOtp = signal<OtpVerifiedResult | null>(null);

let contactForm: UseFormReturn<ContactType> | null = null;

/** Keeps the form, so Cancel can empty it and "Verify" can read the email. */
export function setContactForm(form: UseFormReturn<ContactType>): void {
  contactForm = form;
}

/** OtpModal onVerified: keeps the result (a real app saves oid / uid with the contact). */
export function handleEmailOtpVerified(result: OtpVerifiedResult): void {
  verifiedEmailOtp.value = result;
}

/** Checks the email field, then opens the OTP dialog for it (the library sends the code). */
async function verifyContactEmail(): Promise<void> {
  if (!contactForm) {
    return;
  }
  const isEmailValid = await contactForm.trigger("email");
  if (!isEmailValid) {
    return;
  }
  const email = contactForm.getValues("email");
  verifiedEmailOtp.value = null;
  openOtpModal({ userId: email, onVerified: handleEmailOtpVerified });
}

/** "Verify" button next to the email. */
export function contactEmailVerify(): void {
  void verifyContactEmail();
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
  contactForm?.reset(defaultValues);
  submittedContact.value = null;
  verifiedEmailOtp.value = null;
}
