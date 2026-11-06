// header-user.tsx — the signed-in user menu: at the bottom of the side menu (AppLayout sidebarUser, isInSidebar)
// and in the header when the side menu is not on screen (small screens, mega menu mode, MainLayout).
import { UserMenu, type UserMenuItem } from "shared-lib-web";
import { endSession, sessionEmail } from "../hooks/service.ts";

const userMenuItems: UserMenuItem[] = [{ id: "settings", labelKey: "nav.settings", icon: "Settings", path: "/app-settings" }];

/** "asha@example.com" -> "asha". */
function readNameFromEmail(email: string): string {
  const emailParts = email.split("@");
  return emailParts[0] ?? email;
}

export interface HeaderUserProps {
  /** Sidebar look (full-width row with name and email). */
  isInSidebar?: boolean;
}

export function HeaderUser(props: HeaderUserProps) {
  const email = sessionEmail.value;
  const name = readNameFromEmail(email);
  return <UserMenu name={name} email={email} items={userMenuItems} onLogout={endSession} isInSidebar={props.isInSidebar} />;
}
