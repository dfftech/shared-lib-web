// auth.service.ts — sign in with sor:
//
//   POST sor/auth-signin   { "userid": "super@admin.com", "password": "QWRtaW4xMjM0", "provider": "password" }
//                          (password = base64 of the typed password, dff-util EncodeBase64("Admin1234") -> "QWRtaW4xMjM0")
//
// Reply: { data: { token, id, email, name, mobile, pic, persona, roles: ["SUPER_ADMIN", "ADMIN_ADMIN"], ... }, meta }
// -> token = data.token, user = data without the token. startSession(token, user) saves them, and the library fires
// SESSION_EVENT, so the shell (its own library copy) is signed in at once and loads the menu
// (util /authorization/<persona>?roles=<roles>).

import { EncodeBase64 } from "dff-util";
import { AppHttp, startSession, type AuthUser } from "shared-lib-web";
import { MsUrl } from "./config.ts";

/** What the login form sends. */
export interface SignInValues {
  email: string;
  password: string;
}

/** The sign-in provider of a user id + password login. */
const PASSWORD_PROVIDER = "password";

/** Token field names a sign-in reply may use (the first one found is taken). */
const TOKEN_FIELDS = ["token", "accessToken", "access_token", "jwt", "idToken"];

/** User field names, for a reply that nests the user ({ token, user: {...} }); sor sends the user fields flat. */
const USER_FIELDS = ["user", "profile", "userInfo"];

/** true for a plain object (not null, not a list). */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  const isObject = typeof value === "object" && value !== null;
  return isObject && !Array.isArray(value);
}

/** The reply without its "data" wrapper (when it has one). */
function unwrapReply(reply: unknown): Record<string, unknown> {
  if (!isPlainObject(reply)) {
    return {};
  }
  const data = reply.data;
  return isPlainObject(data) ? data : reply;
}

/** The first text field of the list ("" when none). */
function readTextField(source: Record<string, unknown>, fieldNames: string[]): string {
  for (const fieldName of fieldNames) {
    const value = source[fieldName];
    if (typeof value === "string" && value !== "") {
      return value;
    }
  }
  return "";
}

/** The reply fields without the token fields (the token is saved on its own, never inside the user). */
function withoutTokenFields(source: Record<string, unknown>): Record<string, unknown> {
  const fields: Record<string, unknown> = {};
  const entries = Object.entries(source);
  for (const [key, value] of entries) {
    const isTokenField = TOKEN_FIELDS.includes(key);
    if (!isTokenField) {
      fields[key] = value;
    }
  }
  return fields;
}

/**
 * The signed-in user: a nested user object when the reply has one, else the reply fields themselves (sor:
 * id, email, name, mobile, pic, persona, roles ...) without the token. id / email default to the typed user id.
 */
function readReplyUser(source: Record<string, unknown>, userId: string): AuthUser {
  for (const fieldName of USER_FIELDS) {
    const value = source[fieldName];
    if (isPlainObject(value)) {
      return { id: userId, email: userId, ...value } as AuthUser;
    }
  }
  const userFields = withoutTokenFields(source);
  return { id: userId, email: userId, ...userFields } as AuthUser;
}

/** The request body: the user id, the base64 password and the provider. */
export function buildSignInBody(values: SignInValues): Record<string, string> {
  const encodedPassword = EncodeBase64(values.password);
  return { userid: values.email, password: encodedPassword, provider: PASSWORD_PROVIDER };
}

/**
 * POST sor/auth-signin, then startSession(token, user). Throws when the request fails or the reply has no token
 * (the login form shows the error).
 */
export async function signIn(values: SignInValues): Promise<void> {
  const body = buildSignInBody(values);
  const reply = await AppHttp.Post(`${MsUrl.sor}/auth-signin`, body);
  const source = unwrapReply(reply);
  const token = readTextField(source, TOKEN_FIELDS);
  if (!token) {
    throw new Error("The sign-in reply has no token.");
  }
  const user = readReplyUser(source, values.email);
  startSession(token, user);
}
