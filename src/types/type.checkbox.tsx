// type.checkbox.tsx
// Checkbox (boolean) connected to react-hook-form.
//
//   <TypeCheckbox control={control} name="acceptTerms" label={t("terms.accept")} rules={{ required: { value: true, message: ConstKeys.REQUIRED } }} />

import { useId } from "react";
import { useController, type FieldValues } from "react-hook-form";
import { useUi } from "../context/use-ui.ts";
import { joinClassNames } from "./class-names.ts";
import { readFieldErrorText } from "./field-error.ts";
import type { TypeFieldProps } from "./field-props.ts";

export type TypeCheckboxProps<TFieldValues extends FieldValues> = TypeFieldProps<TFieldValues>;

export function TypeCheckbox<TFieldValues extends FieldValues>(props: TypeCheckboxProps<TFieldValues>) {
  const { control, name, label, rules, error, hint, disabled, className } = props;
  const { t } = useUi();
  const inputId = useId();
  const controllerOptions = { control: control, name: name, rules: rules, disabled: disabled };
  const { field, fieldState } = useController(controllerOptions);
  const fieldError = error ?? fieldState.error;
  const errorText = readFieldErrorText(fieldError, t);
  const isChecked = Boolean(field.value);
  const classList = ["fieldset", className];
  const wrapperClassName = joinClassNames(classList);
  const checkboxClassName = errorText ? "checkbox checkbox-error" : "checkbox checkbox-primary";
  const messageText = errorText ?? hint;

  return (
    <fieldset className={wrapperClassName}>
      <label className="label cursor-pointer gap-3 text-base-content" htmlFor={inputId}>
        <input
          id={inputId}
          ref={field.ref}
          name={field.name}
          type="checkbox"
          checked={isChecked}
          onChange={field.onChange}
          onBlur={field.onBlur}
          disabled={field.disabled}
          className={checkboxClassName}
          aria-invalid={Boolean(errorText)}
        />
        <span>{label}</span>
      </label>
      {messageText ? <p className={errorText ? "label text-error" : "label"}>{messageText}</p> : null}
    </fieldset>
  );
}
