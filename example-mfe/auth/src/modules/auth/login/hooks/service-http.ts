// Login HTTP call (and its loading signal):
//
//   POST sor/auth-signin   { "userid": "super@admin.com", "password": "QWRtaW4xMjM0", "provider": "password" }
//                          (password = dff-util EncodeBase64 of the typed password: "Admin1234" -> "QWRtaW4xMjM0")
//
// Reply: { data: { token, id, email, name, mobile, pic, persona, roles: ["SUPER_ADMIN", "ADMIN_ADMIN"], ... }, meta }
//   -> token = data.token, user = data without the token.
// Errors: { message } or { error: { message } } -> a toast with the backend's message (readErrorMessage).

import { signal } from "@preact/signals-react";
import { EncodeBase64 } from "dff-util";
import { AppHttp, ShowToast, readErrorMessage, translate, type AuthUser } from "shared-lib-web";
import { MsUrl } from "../../../../config.ts";
import type { LoginSessionType, LoginType } from "./types.ts";

export const loginIsLoading = signal(false);

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

/** The signed-in user: a nested user object, else the reply fields themselves without the token. */
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
export function buildLoginBody(values: LoginType): Record<string, string> {
  const encodedPassword = EncodeBase64(values.password);
  return { userid: values.email, password: encodedPassword, provider: PASSWORD_PROVIDER };
}

/** A failed sign in: the backend's message, else login.failed. */
function showLoginError(error: unknown): void {
  const failedText = translate("login.failed");
  const message = readErrorMessage(error, failedText);
  ShowToast(message, "error");
}

/** POST sor/auth-signin. Returns the token + user, or undefined after showing the error. */
export async function loginCall(values: LoginType): Promise<LoginSessionType | undefined> {
  try {
    loginIsLoading.value = true;
    const body = buildLoginBody(values);
    const reply = await AppHttp.Post(`${MsUrl.sor}/auth-signin`, body);
    const source = unwrapReply(reply);
    const token = readTextField(source, TOKEN_FIELDS);
    if (!token) {
      showLoginError(null);
      return undefined;
    }
    const user = readReplyUser(source, values.email);
    return { token: token, user: user };
  } catch (error) {
    showLoginError(error);
    return undefined;
  } finally {
    loginIsLoading.value = false;
  }
}
