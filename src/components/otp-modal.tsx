// otp-modal.tsx
// One-time code dialog: TypeModal + TypeOtp. Render it once (page or layout) and open it with openOtpModal();
// the code is sent on open, "Resend code" works after config.http.otp.resendSeconds, and the form verifies the
// code (on Verify, or by itself once every box is filled). State and HTTP calls: state/otp-service.ts.
//
//   <OtpModal />
//   openOtpModal({ userId: email, title: t("profile.verifyEmail"), message: t("profile.verifyEmailText"),
//                  onVerified: handleEmailVerified });

import { ConstKeys, ConstValue, RegExp as UtilRegExp } from "dff-util";
import { useEffect } from "react";
import { useForm, useWatch, type RegisterOptions } from "react-hook-form";
import { useUi } from "../context/use-ui.ts";
import type { TranslateFunction } from "../interfaces/ui-context.ts";
import {
  cancelOtpModal,
  formatOtpCountdown,
  handleOtpResend,
  handleOtpVerify,
  otpIsSendingSignal,
  otpIsVerifyingSignal,
  otpModalSignal,
  otpResendSecondsSignal,
  readOtpLength,
  type OtpFormType,
} from "../state/otp-service.ts";
import { TypeButton } from "../types/type.button.tsx";
import { TypeModal } from "../types/type.modal.tsx";
import { TypeOtp } from "../types/type.otp.tsx";

/** id of the <form>: the Verify button in the modal footer points at it. */
export const OTP_FORM_ID = "shared-lib-web-otp-form";

const OTP_DEFAULT_VALUES: OtpFormType = { otp: ConstValue.EMPTY };

interface OtpModalDialogProps {
  title: string;
  message: string;
  userId: string;
}

/** Required, digits only, exactly `length` characters. */
function buildOtpRules(length: number): RegisterOptions<OtpFormType, "otp"> {
  return {
    required: { value: true, message: ConstKeys.REQUIRED },
    pattern: { value: UtilRegExp.DIGITS_ONLY, message: ConstKeys.FIELD_MUST_BE_NUMERIC },
    minLength: { value: length, message: ConstKeys.MIN_LENGTH_REQUIRED },
  };
}

/** "Resend in 2:05", "Resend code". */
function readResendLabel(seconds: number, t: TranslateFunction): string {
  if (seconds <= 0) {
    return t("ui.otpResend");
  }
  const time = formatOtpCountdown(seconds);
  return t("ui.otpResendIn", { time: time });
}

/** Verifies by itself once every box is filled (for useEffect, bound with the current value). */
function submitWhenComplete(otpValue: string, length: number, submit: () => Promise<void>): void {
  const isComplete = otpValue.length === length;
  if (!isComplete || otpIsVerifyingSignal.peek()) {
    return;
  }
  void submit();
}

/** The open dialog. A new form every time it opens (keyed by the user id). */
function OtpModalDialog(props: OtpModalDialogProps) {
  const { title, message, userId } = props;
  const { t } = useUi();
  const length = readOtpLength();
  const formOptions = { defaultValues: OTP_DEFAULT_VALUES };
  const form = useForm<OtpFormType>(formOptions);
  const onSubmit = form.handleSubmit(handleOtpVerify);
  const watchOptions = { control: form.control, name: "otp" as const };
  const watchedOtp = useWatch(watchOptions);
  const otpValue = watchedOtp ?? ConstValue.EMPTY;
  const autoSubmit = submitWhenComplete.bind(null, otpValue, length, onSubmit);
  const autoSubmitDeps = [otpValue];
  useEffect(autoSubmit, autoSubmitDeps);

  const otpRules = buildOtpRules(length);
  const isSending = otpIsSendingSignal.value;
  const isVerifying = otpIsVerifyingSignal.value;
  const resendSeconds = otpResendSecondsSignal.value;
  const resendLabel = readResendLabel(resendSeconds, t);
  const isVerifyDisabled = otpValue.length < length || isSending;

  const footer = (
    <>
      <TypeButton action="ghost" label={t("ui.cancel")} onPress={cancelOtpModal} disabled={isVerifying} />
      <TypeButton
        type="submit"
        form={OTP_FORM_ID}
        icon="ShieldCheck"
        label={t("ui.otpVerify")}
        isLoading={isVerifying}
        disabled={isVerifyDisabled}
      />
    </>
  );

  return (
    <TypeModal isOpen title={title} onClose={cancelOtpModal} size="sm" footer={footer}>
      <form id={OTP_FORM_ID} onSubmit={onSubmit} noValidate className="flex flex-col items-center gap-4 text-center">
        <div className="space-y-1">
          <p className="text-lg font-semibold break-all" dir="ltr">
            {userId}
          </p>
          <p className="mx-auto max-w-xs text-sm leading-relaxed opacity-70">{message}</p>
        </div>
        <TypeOtp
          control={form.control}
          name="otp"
          label={t("ui.otpCode")}
          isLabelHidden
          length={length}
          rules={otpRules}
          disabled={isVerifying}
        />
        <div className="flex flex-wrap items-center justify-center gap-1 text-sm">
          <span className="opacity-70">{t("ui.otpNoCode")}</span>
          <TypeButton
            action="link"
            size="sm"
            label={resendLabel}
            onPress={handleOtpResend}
            isLoading={isSending}
            disabled={resendSeconds > 0 || isVerifying}
          />
        </div>
      </form>
    </TypeModal>
  );
}

/** The one-time code dialog. Shows nothing until openOtpModal() is called. */
export function OtpModal() {
  useUi();
  const state = otpModalSignal.value;
  if (!state.isOpen) {
    return null;
  }
  return (
    <OtpModalDialog
      key={state.userId}
      title={state.title}
      message={state.message}
      userId={state.userId}
    />
  );
}
