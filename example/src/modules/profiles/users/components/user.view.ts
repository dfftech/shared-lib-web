// user.view.ts — TypeScript only: read-only details and actions.
import { canAccess, useUi, type TranslateFunction, type TypeButtonProps } from "shared-lib-web";
import { DateTime12HrFormat } from "dff-util";
import { SelectedUser, editModeUpdate, openUserDeleteConfirm, userSelectedId } from "../hooks/service.ts";
import type { UserType } from "../hooks/types.ts";
import { renderUserRole, renderUserStatus } from "./user.grid.ts";

export interface UserDetailRow {
  label: string;
  value: string;
}

export interface UserViewModel {
  isLoading: boolean;
  details: UserDetailRow[];
  editProps: TypeButtonProps;
  deleteProps: TypeButtonProps;
  canDelete: boolean;
}

export function handleUserEditClick(): void {
  const userId = userSelectedId.value;
  void editModeUpdate(userId, "edit");
}

/** Label / value pairs shown in the view. */
export function buildUserDetails(user: UserType | null, t: TranslateFunction): UserDetailRow[] {
  if (!user) {
    return [];
  }
  const updatedDate = new Date(user.updatedAt);
  const updatedText = DateTime12HrFormat(updatedDate);
  return [
    { label: t("user.name"), value: user.name },
    { label: t("user.email"), value: user.email },
    { label: t("user.phone"), value: user.phone },
    { label: t("user.role"), value: renderUserRole(user) },
    { label: t("user.country"), value: user.country },
    { label: t("user.status"), value: renderUserStatus(user) },
    { label: t("user.updated"), value: updatedText },
    { label: t("user.notes"), value: user.notes },
  ];
}

export function useUserView(): UserViewModel {
  const { t } = useUi();
  const user = SelectedUser.value;
  const canUpdate = canAccess("update");
  const canDelete = canAccess("delete");
  const details = buildUserDetails(user, t);

  return {
    isLoading: user === null,
    details: details,
    editProps: { action: "primary", label: t("user.edit"), icon: "Pencil", disabled: !canUpdate, onPress: handleUserEditClick },
    deleteProps: { action: "error", isOutline: true, label: t("user.delete"), icon: "Trash2", onPress: openUserDeleteConfirm },
    canDelete: canDelete,
  };
}
