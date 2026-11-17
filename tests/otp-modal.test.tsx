// Tests for OtpModal: send on open (config.http.otp.sendUrl), verify (verifyUrl), resend countdown, cancel.
import { afterEach, describe, it } from "node:test";
import { expect } from "./expect.ts";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import {
  OtpModal,
  SharedWebUiProvider,
  closeOtpModal,
  formatOtpCountdown,
  openOtpModal,
  otpModalSignal,
  otpResendSecondsSignal,
  otpSessionSignal,
  type OtpVerifiedResult,
  type UiConfig,
} from "../src/index.ts";
import { testConfig } from "./test-config.ts";

const sentBodies: Array<{ url: string; body: unknown }> = [];
const verifiedResults: OtpVerifiedResult[] = [];
let cancelCount = 0;

const otpConfig: UiConfig = {
  ...testConfig,
  http: {
    baseUrl: "https://api.test/api",
    showProgress: false,
    otp: { sendUrl: "/org-sor/otp-send", verifyUrl: "/org-sor/otp-verify", resendSeconds: 30, length: 4 },
  },
};

/** Fake backend: send answers oid / uid; verify accepts "1234" only. */
async function fakeOtpFetch(input: string | URL | Request, init?: RequestInit): Promise<Response> {
  const url = String(input);
  const bodyText = String(init?.body ?? "{}");
  const body = JSON.parse(bodyText) as { otp?: string };
  sentBodies.push({ url: url, body: body });
  const headers = { "content-type": "application/json" };
  if (url.endsWith("/otp-verify") && body.otp !== "1234") {
    const errorText = JSON.stringify({ code: "invalid", message: "Wrong code" });
    return new Response(errorText, { status: 400, headers: headers });
  }
  const replyText = JSON.stringify({ data: { message: "Done", oid: "O1", uid: "U1" } });
  return new Response(replyText, { status: 200, headers: headers });
}

function rememberVerified(result: OtpVerifiedResult): void {
  verifiedResults.push(result);
}

function countCancel(): void {
  cancelCount += 1;
}

function openForAsha(): void {
  openOtpModal({ userId: "asha@example.com", onVerified: rememberVerified, onCancel: countCancel });
}

function openWithMessage(): void {
  openOtpModal({ userId: "asha@example.com", title: "Verify email", message: "Enter the code sent to your email." });
}

async function renderOtpModal(): Promise<void> {
  globalThis.fetch = fakeOtpFetch as typeof fetch;
  render(
    <SharedWebUiProvider config={otpConfig}>
      <span>otp-ready</span>
      <OtpModal />
    </SharedWebUiProvider>,
  );
  await screen.findByText("otp-ready");
}

function readCodeInput(): HTMLInputElement {
  return screen.getByLabelText("OTP") as HTMLInputElement;
}

function typeCode(code: string): void {
  const input = readCodeInput();
  const changeEvent = { target: { value: code } };
  fireEvent.change(input, changeEvent);
}

function readSessionOid(): string | undefined {
  return otpSessionSignal.value?.oid;
}

function readVerifiedCount(): number {
  return verifiedResults.length;
}

async function testSendsOnOpenAndVerifies(): Promise<void> {
  await renderOtpModal();
  act(openForAsha);
  expect(await screen.findByText("asha@example.com")).toBeTruthy();
  expect(screen.getByText("Please enter the OTP sent to your registered id to verify your identity.")).toBeTruthy();
  await waitFor(function sessionIsSet() {
    expect(readSessionOid()).toBe("O1");
  });
  expect(sentBodies[0]?.url).toBe("https://api.test/api/org-sor/otp-send");
  expect(sentBodies[0]?.body).toEqual({ userid: "asha@example.com" });
  expect(otpResendSecondsSignal.value).toBe(30);
  expect(screen.getByRole("button", { name: "Resend in 0:30" })).toBeTruthy();
  // 4 characters (config.http.otp.length): the form verifies by itself.
  typeCode("1234");
  await waitFor(function verifiedOnce() {
    expect(readVerifiedCount()).toBe(1);
  });
  expect(sentBodies[1]?.url).toBe("https://api.test/api/org-sor/otp-verify");
  expect(sentBodies[1]?.body).toEqual({ otp: "1234", oid: "O1", uid: "U1" });
  expect(verifiedResults[0]).toEqual({ oid: "O1", uid: "U1", otp: "1234" });
  expect(otpModalSignal.value.isOpen).toBe(false);
  expect(otpResendSecondsSignal.value).toBe(0);
}

async function testWrongCodeKeepsOpenAndCancel(): Promise<void> {
  await renderOtpModal();
  act(openForAsha);
  await waitFor(function sessionIsSet() {
    expect(readSessionOid()).toBe("O1");
  });
  typeCode("9999");
  expect(await screen.findByText("Wrong code")).toBeTruthy();
  expect(otpModalSignal.value.isOpen).toBe(true);
  expect(readVerifiedCount()).toBe(0);
  const cancelButton = screen.getByRole("button", { name: "Cancel" });
  fireEvent.click(cancelButton);
  expect(cancelCount).toBe(1);
  expect(otpModalSignal.value.isOpen).toBe(false);
  expect(screen.queryByText("asha@example.com")).toBeNull();
}

async function testDynamicTitleAndMessage(): Promise<void> {
  await renderOtpModal();
  act(openWithMessage);
  expect(await screen.findByText("Enter the code sent to your email.")).toBeTruthy();
  expect(screen.getByText("Verify email")).toBeTruthy();
}

function testFormatCountdown(): void {
  expect(formatOtpCountdown(180)).toBe("3:00");
  expect(formatOtpCountdown(125)).toBe("2:05");
  expect(formatOtpCountdown(9)).toBe("0:09");
}

function resetOtpTest(): void {
  act(closeOtpModal);
  cleanup();
  sentBodies.length = 0;
  verifiedResults.length = 0;
  cancelCount = 0;
}

describe("OtpModal", function describeOtpModal() {
  afterEach(resetOtpTest);
  it("sends the code on open and verifies it with the config URLs", testSendsOnOpenAndVerifies);
  it("keeps the dialog open on a wrong code; Cancel calls onCancel", testWrongCodeKeepsOpenAndCancel);
  it("shows the title and message passed to openOtpModal", testDynamicTitleAndMessage);
  it("formats the resend countdown", testFormatCountdown);
});
