// Popup / edit-mode / screen-action state of the user module. No HTTP here.
import { signal } from "@preact/signals-react";
import { ShowToast, readQueryParams, setQueryParams, translate } from "shared-lib-web";
import { ConstValue } from "dff-util";
import { getDefaultUser } from "./data.ts";
import { userByIdCall, userDeleteCall, userListCall } from "./service-http.ts";
import type { UserEditMode, UserType } from "./types.ts";

export const userIsPopupOpen = signal(false);
export const userIsEditMode = signal(false);
export const userSelectedId = signal<string | undefined>(undefined);
export const SelectedUser = signal<UserType | null>(null);
export const userSearchText = signal<string>(ConstValue.EMPTY);
export const userDeleteConfirmOpen = signal(false);
export const userRoleFilter = signal<string>(ConstValue.EMPTY);

/** Opens the "delete user?" confirm dialog. */
export function openUserDeleteConfirm(): void {
  userDeleteConfirmOpen.value = true;
}

/** Closes the "delete user?" confirm dialog. */
export function closeUserDeleteConfirm(): void {
  userDeleteConfirmOpen.value = false;
}

/** Query parameters of the side popup: ?userId=42&mode=view|edit|add (no redirect, survives a refresh). */
export const USER_ID_PARAM = "userId";
export const USER_MODE_PARAM = "mode";

/** Opens the popup that the address bar asks for: ?mode=add, ?userId=42&mode=view or ?userId=42&mode=edit. */
export function applyScreenAction(): void {
  const params = readQueryParams();
  const id = params[USER_ID_PARAM];
  const mode = params[USER_MODE_PARAM];
  if (mode === "add") {
    void editModeUpdate(undefined, "add");
    return;
  }
  if (id && mode === "edit") {
    void editModeUpdate(id, "edit");
    return;
  }
  if (id) {
    void editModeUpdate(id);
  }
}

/** Opens or closes the side popup in view, edit or add mode, and keeps ?userId / ?mode in the address bar. */
export async function editModeUpdate(id?: string, mode?: UserEditMode): Promise<void> {
  if (mode === "add") {
    SelectedUser.value = getDefaultUser();
    userSelectedId.value = undefined;
    userIsEditMode.value = true;
    userIsPopupOpen.value = true;
    setQueryParams({ [USER_ID_PARAM]: undefined, [USER_MODE_PARAM]: "add" });
    return;
  }
  if (id) {
    userSelectedId.value = id;
    userIsEditMode.value = mode === "edit";
    userIsPopupOpen.value = true;
    SelectedUser.value = null;
    const modeValue = mode === "edit" ? "edit" : "view";
    setQueryParams({ [USER_ID_PARAM]: id, [USER_MODE_PARAM]: modeValue });
    const user = await userByIdCall(id);
    SelectedUser.value = user ?? null;
    return;
  }
  userSelectedId.value = undefined;
  userIsEditMode.value = false;
  userIsPopupOpen.value = false;
  SelectedUser.value = null;
  setQueryParams({ [USER_ID_PARAM]: undefined, [USER_MODE_PARAM]: undefined });
}

/** Closes the popup. Usable directly as a click handler. */
export function closeUserPopup(): void {
  void editModeUpdate(undefined);
}

/** Confirm button of the delete dialog: deletes the selected user, closes dialog and drawer, reloads the list. */
export async function handleUserDeleteConfirm(): Promise<void> {
  const userId = userSelectedId.value;
  if (!userId) {
    return;
  }
  await userDeleteCall(userId);
  closeUserDeleteConfirm();
  await editModeUpdate(undefined);
  const message = translate("user.deleted");
  ShowToast(message, "success");
  await userListCall();
}
