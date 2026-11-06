// type.otp.tsx
// One-time code input connected to react-hook-form.
// One real input (so paste, autofill and the keyboard work) drawn as separate boxes.
//
//   <TypeOtp control={control} name="code" label={t("login.code")} length={6} rules={otpValidation} />
//   const otpValidation = { required: { value: true, message: ConstKeys.REQUIRED },
//                           pattern: { value: RegExp.DIGITS_ONLY, message: ConstKeys.FIELD_MUST_BE_NUMERIC } };

import { ConstValue } from "dff-util";
import { useId, type ReactElement } from "react";
import { useController, type FieldValues } from "react-hook-form";
import { useUi } from "../context/use-ui.ts";
import { FieldWrapper, readMessageId } from "./field-wrapper.tsx";
import { joinClassNames } from "./class-names.ts";
import { readFieldErrorText } from "./field-error.ts";
import type { TypeFieldProps } from "./field-props.ts";

export interface TypeOtpProps<TFieldValues extends FieldValues> extends TypeFieldProps<TFieldValues> {
  /** Number of characters. Default 6. */
  length?: number;
}

/** Builds the boxes that show one character each. The box at the cursor is highlighted. */
function buildOtpBoxes(value: string, length: number, hasError: boolean): ReactElement[] {
  const boxes: ReactElement[] = [];
  for (let index = 0; index < length; index += 1) {
    const character = value.charAt(index);
    const isCurrent = index === value.length;
    const classList = [
      "flex size-11 items-center justify-center rounded-field border bg-base-100 text-lg font-semibold",
      hasError ? "border-error" : "border-base-300",
      isCurrent ? "peer-focus:border-primary peer-focus:ring-2 peer-focus:ring-primary/30" : "",
    ];
    const boxClassName = joinClassNames(classList);
    const box = (
      <span key={index} className={boxClassName} aria-hidden="true">
        {character}
      </span>
    );
    boxes.push(box);
  }
  return boxes;
}

export function TypeOtp<TFieldValues extends FieldValues>(props: TypeOtpProps<TFieldValues>) {
  const { control, name, label, rules, error, hint, disabled, className, length = 6 } = props;
  const { t } = useUi();
  const inputId = useId();
  const controllerOptions = { control: control, name: name, rules: rules, disabled: disabled };
  const { field, fieldState } = useController(controllerOptions);
  const fieldError = error ?? fieldState.error;
  const errorText = readFieldErrorText(fieldError, t);
  const hasError = Boolean(errorText);
  const messageId = readMessageId(inputId);
  const rawValue = field.value ?? ConstValue.EMPTY;
  const value = String(rawValue);
  const boxes = buildOtpBoxes(value, length, hasError);

  return (
    <FieldWrapper inputId={inputId} label={label} errorText={errorText} hint={hint} className={className}>
      <div className="relative flex w-fit gap-2" dir="ltr">
        <input
          id={inputId}
          ref={field.ref}
          name={field.name}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={length}
          value={value}
          onChange={field.onChange}
          onBlur={field.onBlur}
          disabled={field.disabled}
          className="peer absolute inset-0 z-10 w-full cursor-text opacity-0"
          aria-invalid={hasError}
          aria-describedby={errorText || hint ? messageId : undefined}
        />
        {boxes}
      </div>
    </FieldWrapper>
  );
}
