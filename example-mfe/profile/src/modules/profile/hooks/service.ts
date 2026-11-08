// Profile state: the shown profile and the edit drawer (no HTTP here).
import { signal } from "@preact/signals-react";
import { ShowToast, translate } from "shared-lib-web";
import { getDefaultProfile } from "./data.ts";
import type { ProfileType } from "./types.ts";

/** id of the edit <form>. */
export const PROFILE_FORM_ID = "mfe-profile-form";

/** The profile on screen. */
const initialProfile = getDefaultProfile();
export const selectedProfile = signal<ProfileType>(initialProfile);

/** true while the edit drawer is open. */
export const profileIsEditOpen = signal(false);

export function openProfileEdit(): void {
  profileIsEditOpen.value = true;
}

export function closeProfileEdit(): void {
  profileIsEditOpen.value = false;
}

/** Saved in the drawer: show the new values and close it (a real app saves with a call from service-http.ts). */
export function profileSaved(values: ProfileType): void {
  selectedProfile.value = values;
  profileIsEditOpen.value = false;
  const message = translate("profile.saved");
  ShowToast(message, "success");
}
