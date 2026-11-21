// user.list.ts — TypeScript only: list data, filters and props.
import type { CellContext, ColumnDef } from '@tanstack/react-table';
import { TimeAgo } from 'dff-util';
import { useEffect, type ChangeEvent } from 'react';
import {
  translate,
  useUi,
  type TranslateFunction,
  type TypeButtonProps,
  type TypeDataViewProps,
  type TypeFilterProps,
  type TypeSearchProps,
} from 'shared-lib-web';
import { userListCall, userListIsLoading, userRows } from "../hooks/service-http.ts";
import { countryLoadCall, roleLoadCall, roleOptions } from "../hooks/service-load.ts";
import { editModeUpdate, userRoleFilter, userSearchText } from '../hooks/service.ts';
import type { UserType } from '../hooks/types.ts';

const RUN_ONCE: never[] = [];

export interface UserListModel {
  titleText: string;
  searchProps: TypeSearchProps;
  roleFilterProps: TypeFilterProps;
  reloadProps: TypeButtonProps;
  addProps: TypeButtonProps;
  dataViewProps: TypeDataViewProps<UserType>;
}

export function readUserRoleCell(user: UserType): string {
  const roleKey = `roles.${user.role}`;
  return translate(roleKey);
}

export function readUserStatusCell(user: UserType): string {
  const statusKey = user.active ? 'user.active' : 'user.inactive';
  return translate(statusKey);
}

export function readUserUpdatedCell(user: UserType): string {
  const updatedDate = new Date(user.updatedAt);
  return TimeAgo(updatedDate);
}

export function renderUserRoleColumn(context: CellContext<UserType, unknown>): string {
  return readUserRoleCell(context.row.original);
}

export function renderUserStatusColumn(context: CellContext<UserType, unknown>): string {
  return readUserStatusCell(context.row.original);
}

export function renderUserUpdatedColumn(context: CellContext<UserType, unknown>): string {
  return readUserUpdatedCell(context.row.original);
}

export function readUserRowId(user: UserType): string {
  return user.id;
}

export function buildUserDataColumns(t: TranslateFunction): ColumnDef<UserType>[] {
  return [
    { accessorKey: 'name', header: t('user.name'), size: 240 },
    { accessorKey: 'email', header: t('user.email') },
    { accessorKey: 'role', header: t('user.role'), cell: renderUserRoleColumn },
    { accessorKey: 'country', header: t('user.country') },
    { accessorKey: 'active', header: t('user.status'), cell: renderUserStatusColumn },
    {
      accessorKey: 'updatedAt',
      header: t('user.updated'),
      cell: renderUserUpdatedColumn,
      meta: { className: 'whitespace-nowrap' },
    },
  ];
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

export function handleUserRowClick(user: UserType): void {
  const userId = user.id;
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
  const columns = buildUserDataColumns(t);

  return {
    titleText: t('user.title'),
    searchProps: { name: 'search', label: t('ui.search'), value: searchText, onChange: handleUserSearchChange },
    roleFilterProps: {
      label: t('user.role'),
      options: roleOptions.value,
      value: roleFilter,
      onChange: handleRoleFilterChange,
    },
    reloadProps: {
      action: 'ghost',
      size: 'sm',
      label: t('user.reload'),
      icon: 'RefreshCw',
      onPress: handleUserReloadClick,
    },
    addProps: {
      action: 'primary',
      size: 'lg',
      label: t('user.add'),
      icon: 'Plus',
      isIconOnly: true,
      className: 'btn-circle shadow-lg',
      onPress: handleUserAddClick,
    },
    dataViewProps: {
      data: visibleUsers,
      columns,
      getRowId: readUserRowId,
      layout: 'table',
      rendering: 'client',
      height: 'auto',
      loading: userListIsLoading.value,
      onRowClick: handleUserRowClick,
      enableGlobalFilter: false,
      showColumnsMenu: true,
      initialState: { sorting: [] },
    },
  };
}
