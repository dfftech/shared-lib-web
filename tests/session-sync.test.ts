// session-sync.test.ts — SESSION_EVENT: a sign in / out in another library copy (an auth MFE) is applied here.
import { afterEach, describe, it } from "node:test";
import { expect } from "./expect.ts";
import {
  AppStorage,
  AUTH_USER,
  SESSION_EVENT,
  TOKEN,
  authUserSignal,
  endSession,
  isAuthenticatedSignal,
  setAppConfig,
  startSessionSync,
} from "../src/index.ts";

/** What another copy of the library does on sign in / out: save (or clear) the storage, then fire the event. */
function fireOtherCopy(isSignedIn: boolean): void {
  const detail = { isSignedIn: isSignedIn, copyId: "other-copy" };
  const sessionEvent = new CustomEvent(SESSION_EVENT, { detail: detail });
  window.dispatchEvent(sessionEvent);
}

describe("session sync between library copies", () => {
  afterEach(() => {
    endSession([], false);
  });

  it("a sign in in another copy signs this copy in; a sign out signs it out", () => {
    setAppConfig({ appNameKey: "SYNCTEST" });
    startSessionSync();
    expect(isAuthenticatedSignal.value).toBe(false);
    AppStorage.setData(TOKEN, "token-from-auth-mfe");
    AppStorage.setData(AUTH_USER, { id: "P1", email: "p1@example.com" });
    fireOtherCopy(true);
    expect(isAuthenticatedSignal.value).toBe(true);
    expect(authUserSignal.value?.id).toBe("P1");
    AppStorage.clearData([]);
    fireOtherCopy(false);
    expect(isAuthenticatedSignal.value).toBe(false);
    expect(authUserSignal.value).toBe(null);
  });
});
