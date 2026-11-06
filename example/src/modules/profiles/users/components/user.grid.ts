// user.grid.ts — TypeScript only: table columns and cell renderers.
import { translate, type TableColumn } from "shared-lib-web";
import { TimeAgo } from "dff-util";
import type { UserType } from "../hooks/types.ts";

export function renderUserRole(user: UserType): string {
  const roleKey = `user.roles.${user.role}`;
  return translate(roleKey);
}

export function renderUserStatus(user: UserType): string {
  const statusKey = user.active ? "user.active" : "user.inactive";
  return translate(statusKey);
}

export function renderUserUpdated(user: UserType): string {
  const updatedDate = new Date(user.updatedAt);
  return TimeAgo(updatedDate);
}

export const userColumns: TableColumn<UserType>[] = [
  { key: "name", headerKey: "user.name" },
  { key: "email", headerKey: "user.email" },
  { key: "role", headerKey: "user.role", render: renderUserRole },
  { key: "country", headerKey: "user.country" },
  { key: "active", headerKey: "user.status", render: renderUserStatus },
  { key: "updatedAt", headerKey: "user.updated", render: renderUserUpdated, className: "whitespace-nowrap" },
];
