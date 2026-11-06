// type.input.tsx
// Text input connected to react-hook-form.
//
//   <TypeInput control={control} name="email" label={t("user.email")} type="email" rules={userValidation.email} />

import { ConstValue } from "dff-util";
import { useId, type HTMLInputTypeAttribute } from "react";
import { useController, type FieldValues } from "react-hook-form";
import { useUi } from "../context/use-ui.ts";
import { FieldWrapper, readMessageId } from "./field-wrapper.tsx";
import { INPUT_SIZE_CLASSES, joinClassNames, type ControlSize } from "./class-names.ts";
import { readFieldErrorText } from "./field-error.ts";
import type { TypeFieldProps } from "./field-props.ts";

export interface TypeInputProps<TFieldValues extends FieldValues> extends TypeFieldProps<TFieldValues> {
  /** Input type: "text", "email", "password", "number", "date" ... Default "text". */
  type?: HTMLInputTypeAttribute;
  placeholder?: string;
  autoComplete?: string;
  size?: ControlSize;
}

export function TypeInput<TFieldValues extends FieldValues>(props: TypeInputProps<TFieldValues>) {
  const { control, name, label, rules, error, hint, disabled, className, type = "text", placeholder, autoComplete, size = "md" } = props;
  const { t } = useUi();
  const inputId = useId();
  const controllerOptions = { control: control, name: name, rules: rules, disabled: disabled };
  const { field, fieldState } = useController(controllerOptions);
  const fieldError = error ?? fieldState.error;
  const errorText = readFieldErrorText(fieldError, t);
  const hasError = Boolean(errorText);
  const sizeClass = INPUT_SIZE_CLASSES[size];
  const classList = ["input w-full", sizeClass, hasError ? "input-error" : ""];
  const inputClassName = joinClassNames(classList);
  const messageId = readMessageId(inputId);
  const value = field.value ?? ConstValue.EMPTY;

  return (
    <FieldWrapper inputId={inputId} label={label} errorText={errorText} hint={hint} className={className}>
      <input
        id={inputId}
        ref={field.ref}
        name={field.name}
        type={type}
        value={value}
        onChange={field.onChange}
        onBlur={field.onBlur}
        disabled={field.disabled}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={inputClassName}
        aria-invalid={hasError}
        aria-describedby={errorText || hint ? messageId : undefined}
      />
    </FieldWrapper>
  );
}
