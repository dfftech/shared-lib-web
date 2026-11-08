// error-util.ts
// The text to show for a failed request. AppHttp (dff-util Http) throws
//   { url, requestId, body?, error: { ...backend reply, message, main_message } }
// and backends answer in different shapes, for example:
//   { "code": "unknown", "message": "Invalid credentials, please try again", "internal_message": null }
//   { "error": { "message": "Invalid credentials, please try again" } }
//   { "error": "Invalid credentials, please try again" }
//
//   ShowToast(readErrorMessage(error, t("login.failed")), "error");   // (two steps in real code)
//
// The backend's own message wins; internal_message is never shown (main_message / message are the user texts).

import { ConstKeys } from "dff-util";

/** Keys looked at in each object, in this order. "error" goes one level deeper. */
const MESSAGE_KEYS = ["main_message", "message", "error_description", "detail"];

/** How deep "error" objects are followed: { error: { error: { message } } }. */
const MAX_DEPTH = 4;

/** true for a plain object (not null, not a list). */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  const isObject = typeof value === "object" && value !== null;
  return isObject && !Array.isArray(value);
}

/** A text worth showing: not empty and not dff-util's placeholder key (INVALID_DATA). */
function isShowableText(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }
  const text = value.trim();
  return text.length > 0 && text !== ConstKeys.INVALID_DATA;
}

/** The message inside one value: its "error" first (deepest wins), then main_message / message / ... */
function findMessage(value: unknown, depth: number): string {
  if (isShowableText(value)) {
    return value;
  }
  if (!isPlainObject(value) || depth > MAX_DEPTH) {
    return "";
  }
  const nestedMessage = findMessage(value.error, depth + 1);
  if (nestedMessage) {
    return nestedMessage;
  }
  for (const key of MESSAGE_KEYS) {
    const text = value[key];
    if (isShowableText(text)) {
      return text;
    }
  }
  return "";
}

/** The backend's message of a failed request (or an Error's message); the fallback when there is none. */
export function readErrorMessage(error: unknown, fallback: string = ""): string {
  if (error instanceof Error && isShowableText(error.message)) {
    return error.message;
  }
  const message = findMessage(error, 0);
  return message || fallback;
}
