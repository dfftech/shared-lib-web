// type.switch.tsx
// On/off toggle (boolean) connected to react-hook-form.
//
//   <TypeSwitch control={control} name="active" label={t("user.active")} />

import { useId } from "react";
import { useController, type FieldValues } from "react-hook-form";
import { useUi } from "../context/use-ui.ts";
import { joinClassNames } from "./class-names.ts";
import { readFieldErrorText } from "./field-error.ts";
import type { TypeFieldProps } from "./field-props.ts";

export interface TypeSwitchProps<TFieldValues extends FieldValues> extends TypeFieldProps<TFieldValues> {
  /** Show a checkbox instead of a toggle. Default false. */
  isCheckbox?: boolean;
}

export function TypeSwitch<TFieldValues extends FieldValues>(props: TypeSwitchProps<TFieldValues>) {
  const { control, name, label, rules, error, hint, disabled, className, isCheckbox = false } = props;
  const { t } = useUi();
  const inputId = useId();
  const controllerOptions = { control: control, name: name, rules: rules, disabled: disabled };
  const { field, fieldState } = useController(controllerOptions);
  const fieldError = error ?? fieldState.error;
  const errorText = readFieldErrorText(fieldError, t);
  const isChecked = Boolean(field.value);
  const controlClassName = isCheckbox ? "checkbox checkbox-primary" : "toggle toggle-primary";
  const classList = ["fieldset", className];
  const wrapperClassName = joinClassNames(classList);
  const messageText = errorText ?? hint;

  return (
    <fieldset className={wrapperClassName}>
      <label className="label cursor-pointer gap-3" htmlFor={inputId}>
        <input
          id={inputId}
          ref={field.ref}
          name={field.name}
          type="checkbox"
          checked={isChecked}
          onChange={field.onChange}
          onBlur={field.onBlur}
          disabled={field.disabled}
          className={controlClassName}
          aria-invalid={Boolean(errorText)}
        />
        <span className="text-base-content">{label}</span>
      </label>
      {messageText ? <p className={errorText ? "label text-error" : "label"}>{messageText}</p> : null}
    </fieldset>
  );
}
