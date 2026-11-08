// error-util.test.ts — readErrorMessage: the backend message of a failed request, in the shapes backends send.
import { describe, it } from "node:test";
import { expect } from "./expect.ts";
import { ConstKeys } from "dff-util";
import { readErrorMessage } from "../src/index.ts";

const TEXT = "Invalid credentials, please try again";

/** What dff-util Http throws: { url, requestId, error: ErrorWrapper(reply) }. */
function wrap(reply: Record<string, unknown>): unknown {
  const message = (reply.internal_message as string) || (reply.message as string) || ConstKeys.INVALID_DATA;
  const mainMessage = (reply.message as string) || ConstKeys.INVALID_DATA;
  return { url: "/x", requestId: "1", error: { ...reply, message: message, main_message: mainMessage } };
}

describe("readErrorMessage", () => {
  it("{ code, message, internal_message } -> message (internal_message is never shown)", () => {
    expect(readErrorMessage(wrap({ code: "unknown", message: TEXT, details: null, internal_message: null }), "x")).toBe(TEXT);
    expect(readErrorMessage(wrap({ message: TEXT, internal_message: "SQL error 42" }), "x")).toBe(TEXT);
  });

  it("{ error: { message } } and { error: '...' }", () => {
    expect(readErrorMessage(wrap({ error: { message: TEXT } }), "x")).toBe(TEXT);
    expect(readErrorMessage(wrap({ error: TEXT }), "x")).toBe(TEXT);
  });

  it("no message -> the fallback; an Error -> its message", () => {
    expect(readErrorMessage(wrap({}), "login.failed")).toBe("login.failed");
    expect(readErrorMessage(null, "login.failed")).toBe("login.failed");
    expect(readErrorMessage(new Error("No token"), "x")).toBe("No token");
  });
});
