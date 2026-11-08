// Session state of the example (who is logged in). Uses the library session:
//   startSession(token, user, isRemembered)  -> sessionStorage ORG-TOKEN + ORG-AUTH_USER, localStorage ORG-REMEMBER_ME
//   restoreSession()                         -> done by SharedWebUiProvider on start (a refresh keeps you signed in)
//   Menu: app-init/app-init.service.ts loads it after sign in, removed on sign out.
//   endSession()                             -> clears AppStorage but keeps THEME, MENU_MODE ...
import { computed } from "@preact/signals-react";
import {
  authUserSignal,
  endSession as endSharedSession,
  isAuthenticatedSignal,
  startSession as startSharedSession,
} from "shared-lib-web";
import { AppUUID4, ConstValue } from "dff-util";

function readSessionEmail(): string {
  const user = authUserSignal.value;
  return user?.email ?? ConstValue.EMPTY;
}

/** Email of the signed-in user, or "". */
export const sessionEmail = computed(readSessionEmail);

/** true when signed in. */
export const isLoggedIn = isAuthenticatedSignal;

/** Fake login: any email works. A real app saves the token from the login API. */
export function startSession(email: string, remember: boolean): void {
  const fakeToken = AppUUID4();
  // persona + roles: the menu request (util /authorization/<persona>?roles=...); id: the branches (/load/BRANCHS?profile=).
  const user = { id: email, email: email, persona: "admin", roles: ["ADMIN_ADMIN"] };
  startSharedSession(fakeToken, user, remember);
}

/** Log out. */
export function endSession(): void {
  endSharedSession();
}
