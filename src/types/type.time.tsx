// type.time.tsx
// Time picker connected to react-hook-form. The form value is "HH:mm" (or "HH:mm:ss" with seconds), 24-hour.
//
//   <TypeTime control={control} name="openAt" label={t("store.openAt")} />

import { ConstValue } from "dff-util";
import { useId } from "react";
import { useController, type FieldValues } from "react-hook-form";
import { useUi } from "../context/use-ui.ts";
import { FieldWrapper, readMessageId } from "./field-wrapper.tsx";
import { joinClassNames } from "./class-names.ts";
import { readFieldErrorText } from "./field-error.ts";
import type { TypeFieldProps } from "./field-props.ts";

export type TimeGranularity = "hour" | "minute" | "second";

export interface TypeTimeProps<TFieldValues extends FieldValues> extends TypeFieldProps<TFieldValues> {
  /** Smallest step. Default "minute". */
  granularity?: TimeGranularity;
}

const TIME_STEP_SECONDS: Record<TimeGranularity, number> = {
  hour: 3600,
  minute: 60,
  second: 1,
};

export function TypeTime<TFieldValues extends FieldValues>(props: TypeTimeProps<TFieldValues>) {
  const { control, name, label, rules, error, hint, disabled, className, granularity = "minute" } = props;
  const { t } = useUi();
  const inputId = useId();
  const controllerOptions = { control: control, name: name, rules: rules, disabled: disabled };
  const { field, fieldState } = useController(controllerOptions);
  const fieldError = error ?? fieldState.error;
  const errorText = readFieldErrorText(fieldError, t);
  const hasError = Boolean(errorText);
  const classList = ["input w-full", hasError ? "input-error" : ""];
  const inputClassName = joinClassNames(classList);
  const messageId = readMessageId(inputId);
  const stepSeconds = TIME_STEP_SECONDS[granularity];
  const value = field.value ?? ConstValue.EMPTY;

  return (
    <FieldWrapper inputId={inputId} label={label} errorText={errorText} hint={hint} className={className}>
      <input
        id={inputId}
        ref={field.ref}
        name={field.name}
        type="time"
        step={stepSeconds}
        value={value}
        onChange={field.onChange}
        onBlur={field.onBlur}
        disabled={field.disabled}
        className={inputClassName}
        aria-invalid={hasError}
        aria-describedby={errorText || hint ? messageId : undefined}
      />
    </FieldWrapper>
  );
}
