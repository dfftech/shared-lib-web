// user.list.ts — TypeScript only: list data, filters and props.
import {
  readRowKey,
  useUi,
  type TypeButtonProps,
  type TypeFilterProps,
  type TypeSearchProps,
  type TypeTableProps,
} from "shared-lib-web";
import { useEffect, type ChangeEvent, type MouseEvent } from "react";
import { editModeUpdate, userRoleFilter, userSearchText } from "../hooks/service.ts";
import { userListCall, userListIsLoading, userRows } from "../hooks/service-http.ts";
import { countryLoadCall, roleLoadCall, roleOptions } from "../hooks/service-load.ts";
import type { UserType } from "../hooks/types.ts";
import { userColumns } from "./user.grid.ts";

const RUN_ONCE: never[] = [];

export interface UserListModel {
  titleText: string;
  searchProps: TypeSearchProps;
  roleFilterProps: TypeFilterProps;
  reloadProps: TypeButtonProps;
  addProps: TypeButtonProps;
  tableProps: TypeTableProps<UserType>;
}

export function loadUserListOnMount(): void {
  roleLoadCall();
  countryLoadCall();
  void userListCall();
}

export function handleUserSearchChange(event: ChangeEvent<HTMLInputElement>): void {
  const input = event.currentTarget;
  userSearchText.value = input.value;
}

export function handleRoleFilterChange(event: ChangeEvent<HTMLSelectElement>): void {
  const select = event.currentTarget;
  userRoleFilter.value = select.value;
}

export function handleUserReloadClick(): void {
  void userListCall();
}

export function handleUserAddClick(): void {
  void editModeUpdate(undefined, "add");
}

export function handleUserRowClick(event: MouseEvent<HTMLTableRowElement>): void {
  const userId = readRowKey(event);
  void editModeUpdate(userId);
}

/** Keeps the users whose name or email contains the search text and whose role matches the filter. */
export function filterUsers(users: UserType[], searchText: string, roleFilter: string): UserType[] {
  const lowerSearchText = searchText.toLowerCase();
  const matchingUsers: UserType[] = [];
  for (const user of users) {
    const isRoleMatch = roleFilter.length === 0 || user.role === roleFilter;
    if (!isRoleMatch) {
      continue;
    }
    const searchableText = `${user.name} ${user.email}`;
    const lowerSearchableText = searchableText.toLowerCase();
    const isMatch = lowerSearchableText.includes(lowerSearchText);
    if (isMatch) {
      matchingUsers.push(user);
    }
  }
  return matchingUsers;
}

export function useUserList(): UserListModel {
  const { t } = useUi();
  useEffect(loadUserListOnMount, RUN_ONCE);
  const searchText = userSearchText.value;
  const allUsers = userRows.value;
  const roleFilter = userRoleFilter.value;
  const visibleUsers = filterUsers(allUsers, searchText, roleFilter);

  return {
    titleText: t("user.title"),
    searchProps: { name: "search", label: t("ui.search"), value: searchText, onChange: handleUserSearchChange },
    roleFilterProps: { label: t("user.role"), options: roleOptions.value, value: roleFilter, onChange: handleRoleFilterChange },
    reloadProps: { action: "ghost", size: "sm", label: t("user.reload"), icon: "RefreshCw", onPress: handleUserReloadClick },
    addProps: {
      action: "primary",
      size: "lg",
      label: t("user.add"),
      icon: "Plus",
      isIconOnly: true,
      className: "btn-circle shadow-lg",
      onPress: handleUserAddClick,
    },
    tableProps: {
      rows: visibleUsers,
      columns: userColumns,
      rowKey: "id",
      isLoading: userListIsLoading.value,
      onRowClick: handleUserRowClick,
    },
  };
}
