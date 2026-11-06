// profile.service.ts — the profile shown by the profile MFE, and the edit drawer state.
import { signal } from "@preact/signals-react";
import { ShowToast, translate } from "shared-lib-web";

export interface ProfileType {
  name: string;
  email: string;
  phone: string;
  role: string;
  location: string;
  about: string;
}

export const PROFILE_FORM_ID = "mfe-profile-form";

export const profileSignal = signal<ProfileType>({
  name: "Asha Rao",
  email: "asha.rao@org.com",
  phone: "+91 98765 43210",
  role: "editor",
  location: "Hyderabad",
  about: "Plans the store roll-out and keeps the product catalogue up to date.",
});

export const isProfileEditOpen = signal<boolean>(false);

export function openProfileEdit(): void {
  isProfileEditOpen.value = true;
}

export function closeProfileEdit(): void {
  isProfileEditOpen.value = false;
}

export function handleProfileSave(values: ProfileType): void {
  profileSignal.value = values;
  isProfileEditOpen.value = false;
  const message = translate("mfe.profile.saved");
  ShowToast(message, "success");
}
