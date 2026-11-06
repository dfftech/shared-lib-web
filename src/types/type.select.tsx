// type.select.tsx
// Select box connected to react-hook-form. Options use dff-util OptionType.
// When option.lang has a text for the current language code, that text is shown.
//
//   <TypeSelect control={control} name="role" label={t("user.role")} options={roleOptions.value} />

import { ConstValue, type OptionType } from "dff-util";
import { useId, type ReactElement } from "react";
import { useController, type FieldValues } from "react-hook-form";
import { useUi } from "../context/use-ui.ts";
import { FieldWrapper, readMessageId } from "./field-wrapper.tsx";
import { SELECT_SIZE_CLASSES, joinClassNames, type ControlSize } from "./class-names.ts";
import { readFieldErrorText } from "./field-error.ts";
import type { TypeFieldProps } from "./field-props.ts";

export interface TypeSelectProps<TFieldValues extends FieldValues> extends TypeFieldProps<TFieldValues> {
  options: OptionType[];
  /** First empty choice text. Default: translated "Select an option". Set false to hide it. */
  placeholder?: string | false;
  size?: ControlSize;
}

/** Returns the option text for the language, or the default label. */
export function readOptionLabel(option: OptionType, languageCode: string): string {
  const translatedLabels = option.lang;
  const translatedLabel = translatedLabels ? translatedLabels[languageCode] : undefined;
  if (translatedLabel) {
    return translatedLabel;
  }
  return option.label;
}

/** Builds the <option> elements. */
function buildOptionElements(options: OptionType[], languageCode: string): ReactElement[] {
  const optionElements: ReactElement[] = [];
  for (const option of options) {
    const optionLabel = readOptionLabel(option, languageCode);
    const iconText = option.icon ? `${option.icon} ` : ConstValue.EMPTY;
    const optionElement = (
      <option key={option.key} value={option.key} disabled={option.disabled}>
        {iconText}
        {optionLabel}
      </option>
    );
    optionElements.push(optionElement);
  }
  return optionElements;
}

export function TypeSelect<TFieldValues extends FieldValues>(props: TypeSelectProps<TFieldValues>) {
  const { control, name, label, rules, error, hint, disabled, className, options, placeholder, size = "md" } = props;
  const { t, locale } = useUi();
  const inputId = useId();
  const controllerOptions = { control: control, name: name, rules: rules, disabled: disabled };
  const { field, fieldState } = useController(controllerOptions);
  const fieldError = error ?? fieldState.error;
  const errorText = readFieldErrorText(fieldError, t);
  const hasError = Boolean(errorText);
  const sizeClass = SELECT_SIZE_CLASSES[size];
  const classList = ["select w-full", sizeClass, hasError ? "select-error" : ""];
  const selectClassName = joinClassNames(classList);
  const messageId = readMessageId(inputId);
  const defaultPlaceholder = t("ui.selectOption");
  const placeholderText = placeholder ?? defaultPlaceholder;
  const optionElements = buildOptionElements(options, locale);
  const value = field.value ?? ConstValue.EMPTY;

  return (
    <FieldWrapper inputId={inputId} label={label} errorText={errorText} hint={hint} className={className}>
      <select
        id={inputId}
        ref={field.ref}
        name={field.name}
        value={value}
        onChange={field.onChange}
        onBlur={field.onBlur}
        disabled={field.disabled}
        className={selectClassName}
        aria-invalid={hasError}
        aria-describedby={errorText || hint ? messageId : undefined}
      >
        {placeholderText === false ? null : <option value="">{placeholderText}</option>}
        {optionElements}
      </select>
    </FieldWrapper>
  );
}
