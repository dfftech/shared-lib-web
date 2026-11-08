// Login state: who is signed in (no HTTP here). Uses the library session:
//   startSession(token, user)  -> sessionStorage <KEY>-TOKEN + <KEY>-AUTH_USER, and SESSION_EVENT for the other library
//                                 copies: the shell is signed in at once, loads its menu and unmounts this MFE.
//   endSession([], false)      -> signs out without leaving the page (only used when this MFE runs alone).
import { computed } from "@preact/signals-react";
import { ConstValue } from "dff-util";
import { authUserSignal, endSession, isAuthenticatedSignal, startSession } from "shared-lib-web";
import type { LoginSessionType } from "./types.ts";

function readSessionEmail(): string {
  const user = authUserSignal.value;
  return user?.email ?? ConstValue.EMPTY;
}

/** Email of the signed-in user, or "". */
export const sessionEmail = computed(readSessionEmail);

/** true when signed in. */
export const isLoggedIn = isAuthenticatedSignal;

/** Starts the session with the token and user of a successful sign in. */
export function startUserSession(session: LoginSessionType): void {
  startSession(session.token, session.user);
}

/** Sign out (only shown when the MFE runs alone; in the shell the shell's user menu signs out). */
export function endUserSession(): void {
  endSession([], false);
}
