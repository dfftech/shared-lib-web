// type.text-area.tsx
// Multi-line text connected to react-hook-form.

import { ConstValue } from "dff-util";
import { useId } from "react";
import { useController, type FieldValues } from "react-hook-form";
import { useUi } from "../context/use-ui.ts";
import { FieldWrapper, readMessageId } from "./field-wrapper.tsx";
import { joinClassNames } from "./class-names.ts";
import { readFieldErrorText } from "./field-error.ts";
import type { TypeFieldProps } from "./field-props.ts";

export interface TypeTextAreaProps<TFieldValues extends FieldValues> extends TypeFieldProps<TFieldValues> {
  placeholder?: string;
  /** Visible lines. Default 4. */
  rows?: number;
}

export function TypeTextArea<TFieldValues extends FieldValues>(props: TypeTextAreaProps<TFieldValues>) {
  const { control, name, label, rules, error, hint, disabled, className, placeholder, rows = 4 } = props;
  const { t } = useUi();
  const inputId = useId();
  const controllerOptions = { control: control, name: name, rules: rules, disabled: disabled };
  const { field, fieldState } = useController(controllerOptions);
  const fieldError = error ?? fieldState.error;
  const errorText = readFieldErrorText(fieldError, t);
  const hasError = Boolean(errorText);
  const classList = ["textarea w-full", hasError ? "textarea-error" : ""];
  const textAreaClassName = joinClassNames(classList);
  const messageId = readMessageId(inputId);
  const value = field.value ?? ConstValue.EMPTY;

  return (
    <FieldWrapper inputId={inputId} label={label} errorText={errorText} hint={hint} className={className}>
      <textarea
        id={inputId}
        ref={field.ref}
        name={field.name}
        rows={rows}
        value={value}
        onChange={field.onChange}
        onBlur={field.onBlur}
        disabled={field.disabled}
        placeholder={placeholder}
        className={textAreaClassName}
        aria-invalid={hasError}
        aria-describedby={errorText || hint ? messageId : undefined}
      />
    </FieldWrapper>
  );
}
