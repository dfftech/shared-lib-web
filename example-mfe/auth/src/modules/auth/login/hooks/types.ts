// Login types.
import type { AuthUser } from "shared-lib-web";

/** What the login form sends. */
export interface LoginType {
  email: string;
  password: string;
}

/** A successful sign in: the token and the signed-in user (the reply without the token). */
export interface LoginSessionType {
  token: string;
  user: AuthUser;
}
