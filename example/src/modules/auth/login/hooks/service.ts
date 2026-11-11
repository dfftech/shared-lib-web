// Session state of the example (who is logged in). Uses the library session:
//   startSession(token, user, isRemembered)  -> sessionStorage ORG-TOKEN + ORG-AUTH_USER, localStorage ORG-REMEMBER_ME
//   restoreSession()                         -> done by SharedWebUiProvider on start (a refresh keeps you signed in)
//   Branches and menu: app-init/app-init.service.ts loads them after sign in, removed on sign out.
//   endSession()                             -> clears AppStorage but keeps LANG, THEME, MENU_MODE ...
import { computed } from "@preact/signals-react";
import {
  authUserSignal,
  endSession as endSharedSession,
  isAuthenticatedSignal,
  startSession as startSharedSession,
} from "shared-lib-web";
import { ConstValue, JwtEncode } from "dff-util";

function readSessionEmail(): string {
  const user = authUserSignal.value;
  return user?.email ?? ConstValue.EMPTY;
}

/** Email of the signed-in user, or "". */
export const sessionEmail = computed(readSessionEmail);

/** true when signed in. */
export const isLoggedIn = isAuthenticatedSignal;

const FAKE_TOKEN_SECRET = "example-secret";
const FAKE_TOKEN_SECONDS = 86400;

/** Fake login: any email works. A real app saves the token from the login API. */
export function startSession(email: string, remember: boolean): void {
  // A real JWT (1 day): AppHttp checks it with JwtValid before every request.
  const tokenData = { sub: email };
  const fakeToken = JwtEncode(tokenData, FAKE_TOKEN_SECRET, FAKE_TOKEN_SECONDS);
  // persona + roles: the menu request (util /authorization/<persona>?roles=...); id: the branches (/load/BRANCHS?profile=).
  const user = { id: email, email: email, persona: "admin", roles: ["ADMIN_ADMIN"] };
  startSharedSession(fakeToken, user, remember);
}

/** Log out. */
export function endSession(): void {
  endSharedSession();
}
