// type.list.tsx
// Scrollable list of options connected to react-hook-form.
//   selectionMode "multiple": checkboxes, the form value is a string array.
//   selectionMode "single":   radio buttons, the form value is one string.
// Options use dff-util OptionType; option.lang[locale] is shown when present.
//
//   <TypeList control={control} name="languages" label={t("user.languages")} options={languageOptions.value} selectionMode="multiple" />

import type { OptionType } from "dff-util";
import type { ReactElement } from "react";
import type { FieldValues, UseFormRegisterReturn } from "react-hook-form";
import { useFormState } from "react-hook-form";
import { useUi } from "../context/use-ui.ts";
import { joinClassNames } from "./class-names.ts";
import { readFieldErrorText } from "./field-error.ts";
import type { TypeFieldProps } from "./field-props.ts";
import { readOptionLabel } from "./type.select.tsx";

export type ListSelectionMode = "single" | "multiple";

export interface TypeListProps<TFieldValues extends FieldValues> extends TypeFieldProps<TFieldValues> {
  options: OptionType[];
  /** Default "multiple". */
  selectionMode?: ListSelectionMode;
  /** Height class of the list. Default "max-h-64". */
  heightClassName?: string;
}

/** Builds one selectable row per option. */
function buildListRows(
  options: OptionType[],
  registration: UseFormRegisterReturn,
  inputType: "checkbox" | "radio",
  languageCode: string,
  isDisabled: boolean,
): ReactElement[] {
  const rows: ReactElement[] = [];
  const controlClassName = inputType === "checkbox" ? "checkbox checkbox-sm checkbox-primary" : "radio radio-sm radio-primary";
  for (const option of options) {
    const optionLabel = readOptionLabel(option, languageCode);
    const optionValue = String(option.key);
    const isOptionDisabled = isDisabled || Boolean(option.disabled);
    const row = (
      <li key={optionValue}>
        <label className="flex cursor-pointer items-center gap-3 has-[:checked]:bg-primary/10 has-[:checked]:text-primary has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50">
          <input {...registration} type={inputType} value={optionValue} disabled={isOptionDisabled} className={controlClassName} />
          {option.icon ? <span aria-hidden="true">{option.icon}</span> : null}
          <span className="flex-1">{optionLabel}</span>
        </label>
      </li>
    );
    rows.push(row);
  }
  return rows;
}

export function TypeList<TFieldValues extends FieldValues>(props: TypeListProps<TFieldValues>) {
  const {
    control,
    name,
    label,
    rules,
    error,
    hint,
    disabled = false,
    className,
    options,
    selectionMode = "multiple",
    heightClassName = "max-h-64",
  } = props;
  const { t, locale } = useUi();
  const registration = control.register(name, rules);
  const stateOptions = { control: control, name: name };
  const formState = useFormState(stateOptions);
  const fieldStateError = formState.errors[name];
  const fieldError = error ?? (fieldStateError as TypeFieldProps<TFieldValues>["error"]);
  const errorText = readFieldErrorText(fieldError, t);
  const inputType = selectionMode === "multiple" ? "checkbox" : "radio";
  const rows = buildListRows(options, registration, inputType, locale, disabled);
  const classList = ["fieldset", className];
  const wrapperClassName = joinClassNames(classList);
  const listClassList = [
    "menu w-full flex-nowrap overflow-y-auto rounded-box border bg-base-100 p-1",
    heightClassName,
    errorText ? "border-error" : "border-base-300",
  ];
  const listClassName = joinClassNames(listClassList);
  const messageText = errorText ?? hint;

  return (
    <fieldset className={wrapperClassName}>
      <legend className="fieldset-legend">{label}</legend>
      <ul className={listClassName}>{rows}</ul>
      {messageText ? <p className={errorText ? "label text-error" : "label"}>{messageText}</p> : null}
    </fieldset>
  );
}
