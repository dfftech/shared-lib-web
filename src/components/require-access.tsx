// require-access.tsx
// Shows its children only when the user has the permission on the current screen
// (NavItem.permissions of the matching navigation item). Otherwise shows PermissionDenied.
//
//   <RequireAccess><UserPage /></RequireAccess>
//   <RequireAccess action="update" fallback={null}><EditButton /></RequireAccess>

import type { ReactNode } from "react";
import { useUi } from "../context/use-ui.ts";
import { canAccess, type ScreenAction } from "../state/screen-access.ts";
import { PermissionDenied } from "./permission-denied.tsx";

export interface RequireAccessProps {
  /** Permission to check. Default "read". */
  action?: ScreenAction;
  children?: ReactNode;
  /** Shown without permission. Default <PermissionDenied />. */
  fallback?: ReactNode;
}

export function RequireAccess(props: RequireAccessProps) {
  const { action = "read", children, fallback } = props;
  useUi();
  const isAllowed = canAccess(action);
  if (isAllowed) {
    return <>{children}</>;
  }
  const defaultFallback = <PermissionDenied />;
  return <>{fallback === undefined ? defaultFallback : fallback}</>;
}
