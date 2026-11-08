// auth-session.test.ts — sign in sets the user before the token, so code that runs on sign in reads the user.
import { afterEach, describe, it } from "node:test";
import { expect } from "./expect.ts";
import { effect } from "@preact/signals-react";
import { authUserSignal, endSession, isAuthenticatedSignal, setAppConfig, startSession, type AuthUser } from "../src/index.ts";

/** What the sign-in follower saw. */
const seenUsers: Array<AuthUser | null> = [];

/** Like the loaders that run on sign in: reads the user when the session starts. */
function followSignIn(): void {
  const isSignedIn = isAuthenticatedSignal.value;
  if (isSignedIn) {
    const user = authUserSignal.peek();
    seenUsers.push(user);
  }
}

describe("startSession", () => {
  afterEach(() => {
    endSession([], false);
    seenUsers.length = 0;
  });

  it("the user is already there when isAuthenticatedSignal turns true", () => {
    setAppConfig({ appNameKey: "AUTHTEST" });
    const stop = effect(followSignIn);
    startSession("token-1", { id: "P1", persona: "admin", roles: ["ADMIN_ADMIN"] });
    stop();
    expect(seenUsers.length).toBe(1);
    expect(seenUsers[0]?.id).toBe("P1");
    expect(seenUsers[0]?.persona).toBe("admin");
  });
});
