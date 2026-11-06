// session-id.ts
// One random id per browser tab, saved in sessionStorage as "<APPNAMEKEY>-ACTIVE_SESSION_ID" (ORG-ACTIVE_SESSION_ID).
// AppHttp sends it as the x-session-id header on every API request.

import { AppUUID4, ConstValue } from "dff-util";
import { AppStorage } from "./app-storage.ts";
import { ACTIVE_SESSION_ID } from "./storage-keys.ts";

/** Key of older versions (no app prefix); its value is moved to ACTIVE_SESSION_ID once. */
const OLD_SESSION_ID_KEY = "active_session_id";

/** Takes the id saved by an older version (and removes the old key), or "". */
function takeOldSessionId(): string {
  const oldId = window.sessionStorage.getItem(OLD_SESSION_ID_KEY);
  if (!oldId) {
    return ConstValue.EMPTY;
  }
  window.sessionStorage.removeItem(OLD_SESSION_ID_KEY);
  return oldId;
}

/** Returns the tab's session id, creating it on first use. */
export function readSessionId(): string {
  const hasWindow = typeof window !== "undefined";
  if (!hasWindow) {
    return ConstValue.EMPTY;
  }
  // The old unprefixed key is always removed; its id is kept only when there is no new one yet.
  const oldId = takeOldSessionId();
  const storedId = AppStorage.getText(ACTIVE_SESSION_ID);
  if (storedId) {
    return storedId;
  }
  const newId = oldId || AppUUID4();
  AppStorage.setData(ACTIVE_SESSION_ID, newId);
  return newId;
}

/** Starts a new session id (for example after log out). */
export function resetSessionId(): string {
  const hasWindow = typeof window !== "undefined";
  if (!hasWindow) {
    return ConstValue.EMPTY;
  }
  AppStorage.removeData(ACTIVE_SESSION_ID);
  window.sessionStorage.removeItem(OLD_SESSION_ID_KEY);
  return readSessionId();
}
