// type.date.tsx
// Date (or date + time) picker connected to react-hook-form, using the browser date input.
// The form value is text: "2026-11-05" or, with isDateTime, "2026-11-05T14:30".
// A Date object as default value is also shown correctly.
//
//   <TypeDate control={control} name="birthDate" label={t("user.birthDate")} max="2026-12-31" />

import { ConstValue } from "dff-util";
import { useId } from "react";
import { useController, type FieldValues } from "react-hook-form";
import { useUi } from "../context/use-ui.ts";
import { FieldWrapper, readMessageId } from "./field-wrapper.tsx";
import { joinClassNames } from "./class-names.ts";
import { readFieldErrorText } from "./field-error.ts";
import type { TypeFieldProps } from "./field-props.ts";

export interface TypeDateProps<TFieldValues extends FieldValues> extends TypeFieldProps<TFieldValues> {
  /** Also pick the time. Default false. */
  isDateTime?: boolean;
  /** Earliest value, same format as the form value. */
  min?: string;
  /** Latest value, same format as the form value. */
  max?: string;
}

/** Adds a leading zero: 5 -> "05". */
function padNumber(value: number): string {
  const text = String(value);
  return text.padStart(2, "0");
}

/** Formats a Date for the input: "YYYY-MM-DD" or "YYYY-MM-DDTHH:mm" (local time). */
export function formatDateInputValue(date: Date, isDateTime: boolean): string {
  const year = date.getFullYear();
  const monthNumber = date.getMonth() + 1;
  const dayNumber = date.getDate();
  const month = padNumber(monthNumber);
  const day = padNumber(dayNumber);
  const datePart = `${year}-${month}-${day}`;
  if (!isDateTime) {
    return datePart;
  }
  const hourNumber = date.getHours();
  const minuteNumber = date.getMinutes();
  const hours = padNumber(hourNumber);
  const minutes = padNumber(minuteNumber);
  return `${datePart}T${hours}:${minutes}`;
}

/** Turns the form value (text or Date) into the text the input shows. */
export function readDateInputValue(value: unknown, isDateTime: boolean): string {
  if (value instanceof Date) {
    const timeValue = value.getTime();
    const isValidDate = !Number.isNaN(timeValue);
    return isValidDate ? formatDateInputValue(value, isDateTime) : ConstValue.EMPTY;
  }
  if (typeof value === "string") {
    return value;
  }
  return ConstValue.EMPTY;
}

export function TypeDate<TFieldValues extends FieldValues>(props: TypeDateProps<TFieldValues>) {
  const { control, name, label, rules, error, hint, disabled, className, isDateTime = false, min, max } = props;
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
  const inputValue = readDateInputValue(field.value, isDateTime);
  const inputType = isDateTime ? "datetime-local" : "date";

  return (
    <FieldWrapper inputId={inputId} label={label} errorText={errorText} hint={hint} className={className}>
      <input
        id={inputId}
        ref={field.ref}
        name={field.name}
        type={inputType}
        value={inputValue}
        min={min}
        max={max}
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
