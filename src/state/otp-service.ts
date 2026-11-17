// otp-service.ts
// State and HTTP calls of the one-time code dialog (components/otp-modal.tsx). The URLs come from config.http.otp:
//
//   // config.ts
//   http: { baseUrl, otp: { sendUrl: `${MsUrl.sor}/otp-send`, verifyUrl: `${MsUrl.sor}/otp-verify`, resendSeconds: 180 } }
//
//   // page: render <OtpModal /> once, then open it (the code is sent on open)
//   openOtpModal({ userId: email, title: t("profile.verifyEmail"), message: t("profile.verifyEmailText"),
//                  onVerified: handleEmailVerified });
//   export function handleEmailVerified(result: OtpVerifiedResult): void { ... result.oid, result.uid, result.otp ... }
//
// Send:   POST sendUrl   { userid }          -> { data: { message, oid, uid } }
// Verify: POST verifyUrl { otp, oid, uid }   -> { data: { message, oid, uid } }
// The backend message is shown as a toast; a failed call shows the backend error (readErrorMessage).

import { signal } from "@preact/signals-react";
import { ConstValue } from "dff-util";
import { translate } from "../i18n/translator.ts";
import type { OtpConfig } from "../interfaces/ui-config.ts";
import { readAppConfig } from "../utils/app-config.ts";
import { AppHttp } from "../utils/app-http.ts";
import { readErrorMessage } from "../utils/error-util.ts";
import { ShowToast } from "./toast-service.ts";

/** Default number of characters of the code. */
export const DEFAULT_OTP_LENGTH = 6;

/** Default seconds before "Resend code" works again. */
export const DEFAULT_OTP_RESEND_SECONDS = 180;

const OTP_CONFIG_MISSING = "shared-lib-web: config.http.otp (sendUrl, verifyUrl) is missing.";

/** oid + uid of the code that was sent: the verify call needs them. */
export interface OtpSession {
  oid: string;
  uid: string;
}

/** What onVerified receives. */
export interface OtpVerifiedResult extends OtpSession {
  otp: string;
}

/** The form of the dialog. */
export interface OtpFormType {
  otp: string;
}

/** What openOtpModal needs. */
export interface OtpOpenOptions {
  /** Sent as "userid" and shown in the dialog (email, mobile or user id). */
  userId: string;
  /** Heading (already translated). Default t("ui.otpTitle"). */
  title?: string;
  /** Text under the user id (already translated). Default t("ui.otpText"). */
  message?: string;
  /** Called after a successful verify (the dialog is closed by then). */
  onVerified?: (result: OtpVerifiedResult) => void;
  /** Called after Cancel, ✕, Escape or a backdrop click. */
  onCancel?: () => void;
}

/** What the dialog shows. */
export interface OtpModalState {
  isOpen: boolean;
  title: string;
  message: string;
  userId: string;
}

/** The reply fields of the send / verify services. */
interface OtpReply {
  message?: string;
  oid?: string;
  uid?: string;
}

type OtpCallbacks = Pick<OtpOpenOptions, "onVerified" | "onCancel">;

const CLOSED_OTP_MODAL: OtpModalState = {
  isOpen: false,
  title: ConstValue.EMPTY,
  message: ConstValue.EMPTY,
  userId: ConstValue.EMPTY,
};

/** The dialog: open, title and user id. */
export const otpModalSignal = signal<OtpModalState>(CLOSED_OTP_MODAL);

/** oid + uid of the sent code; null = no code sent yet. */
export const otpSessionSignal = signal<OtpSession | null>(null);

/** true while the send call runs. */
export const otpIsSendingSignal = signal(false);

/** true while the verify call runs. */
export const otpIsVerifyingSignal = signal(false);

/** Seconds left before "Resend code" works again (0 = now). */
export const otpResendSecondsSignal = signal(0);

let otpCallbacks: OtpCallbacks = {};

let resendTimer: ReturnType<typeof setInterval> | null = null;

/** config.http.otp, or an error when it is not set. */
export function readOtpConfig(): OtpConfig {
  const config = readAppConfig();
  const otpConfig = config?.http?.otp;
  if (!otpConfig) {
    throw new Error(OTP_CONFIG_MISSING);
  }
  return otpConfig;
}

/** Number of characters of the code: config.http.otp.length, default 6. */
export function readOtpLength(): number {
  const config = readAppConfig();
  return config?.http?.otp?.length ?? DEFAULT_OTP_LENGTH;
}

/** true for a plain object. */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** The reply fields from { data: { message, oid, uid } } or { message, oid, uid }. */
function readOtpReply(reply: unknown): OtpReply {
  if (!isRecord(reply)) {
    return {};
  }
  const source = isRecord(reply.data) ? reply.data : reply;
  return source as OtpReply;
}

/** 125 -> "2:05". */
export function formatOtpCountdown(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  const restText = String(rest);
  const paddedRest = restText.padStart(2, "0");
  return `${minutes}:${paddedRest}`;
}

/** Stops the resend countdown (0 = resend works). */
export function stopOtpResendCountdown(): void {
  if (resendTimer) {
    clearInterval(resendTimer);
    resendTimer = null;
  }
  otpResendSecondsSignal.value = 0;
}

/** One second of the resend countdown. */
function tickOtpResendCountdown(): void {
  const nextSeconds = otpResendSecondsSignal.value - 1;
  if (nextSeconds <= 0) {
    stopOtpResendCountdown();
    return;
  }
  otpResendSecondsSignal.value = nextSeconds;
}

/** Starts the resend countdown (one timer for the whole page). */
function startOtpResendCountdown(seconds: number): void {
  stopOtpResendCountdown();
  if (seconds <= 0) {
    return;
  }
  otpResendSecondsSignal.value = seconds;
  resendTimer = setInterval(tickOtpResendCountdown, 1000);
}

/** The backend message, else the translated fallback. */
function readReplyMessage(otpReply: OtpReply, fallbackKey: string): string {
  const fallback = translate(fallbackKey);
  return otpReply.message || fallback;
}

/** Shows the backend error of a failed call, else the translated fallback. */
function showOtpError(error: unknown, fallbackKey: string): void {
  const fallback = translate(fallbackKey);
  const message = readErrorMessage(error, fallback);
  ShowToast(message, "error");
}

/** POST sendUrl { userid }: keeps oid + uid and starts the resend countdown. Returns true when sent. */
export async function otpSendCall(): Promise<boolean> {
  const userId = otpModalSignal.value.userId;
  if (otpIsSendingSignal.value || userId.length === 0) {
    return false;
  }
  otpIsSendingSignal.value = true;
  try {
    const otpConfig = readOtpConfig();
    const body = { userid: userId };
    const reply = await AppHttp.Post(otpConfig.sendUrl, body);
    const isStillOpen = otpModalSignal.value.isOpen && otpModalSignal.value.userId === userId;
    if (!isStillOpen) {
      return false;
    }
    const otpReply = readOtpReply(reply);
    otpSessionSignal.value = { oid: otpReply.oid ?? ConstValue.EMPTY, uid: otpReply.uid ?? ConstValue.EMPTY };
    const message = readReplyMessage(otpReply, "ui.otpSent");
    ShowToast(message, "success");
    const resendSeconds = otpConfig.resendSeconds ?? DEFAULT_OTP_RESEND_SECONDS;
    startOtpResendCountdown(resendSeconds);
    return true;
  } catch (error: unknown) {
    showOtpError(error, "ui.otpSendFailed");
    return false;
  } finally {
    otpIsSendingSignal.value = false;
  }
}

/** "Resend code" button: sends a new code once the countdown is over. */
export function handleOtpResend(): void {
  if (otpResendSecondsSignal.value > 0) {
    return;
  }
  void otpSendCall();
}

/** POST verifyUrl { otp, oid, uid }: closes the dialog and calls onVerified. For form.handleSubmit. */
export async function handleOtpVerify(values: OtpFormType): Promise<void> {
  const session = otpSessionSignal.value;
  if (otpIsVerifyingSignal.value) {
    return;
  }
  if (!session) {
    const message = translate("ui.otpSessionMissing");
    ShowToast(message, "error");
    return;
  }
  otpIsVerifyingSignal.value = true;
  try {
    const otpConfig = readOtpConfig();
    const body = { otp: values.otp, oid: session.oid, uid: session.uid };
    const reply = await AppHttp.Post(otpConfig.verifyUrl, body);
    const otpReply = readOtpReply(reply);
    const message = readReplyMessage(otpReply, "ui.otpVerified");
    ShowToast(message, "success");
    const result: OtpVerifiedResult = {
      oid: otpReply.oid || session.oid,
      uid: otpReply.uid || session.uid,
      otp: values.otp,
    };
    const onVerified = otpCallbacks.onVerified;
    closeOtpModal();
    onVerified?.(result);
  } catch (error: unknown) {
    showOtpError(error, "ui.otpInvalid");
  } finally {
    otpIsVerifyingSignal.value = false;
  }
}

/** Opens the dialog for a user id and sends the code. */
export function openOtpModal(options: OtpOpenOptions): void {
  stopOtpResendCountdown();
  otpCallbacks = { onVerified: options.onVerified, onCancel: options.onCancel };
  otpSessionSignal.value = null;
  const title = options.title ?? translate("ui.otpTitle");
  const message = options.message ?? translate("ui.otpText");
  otpModalSignal.value = { isOpen: true, title: title, message: message, userId: options.userId };
  void otpSendCall();
}

/** Closes the dialog without calling onCancel (also used after a successful verify). */
export function closeOtpModal(): void {
  stopOtpResendCountdown();
  otpCallbacks = {};
  otpSessionSignal.value = null;
  otpModalSignal.value = CLOSED_OTP_MODAL;
}

/** Cancel, ✕, Escape or a backdrop click: closes the dialog and calls onCancel. */
export function cancelOtpModal(): void {
  const onCancel = otpCallbacks.onCancel;
  closeOtpModal();
  onCancel?.();
}
