// type.lang.tsx
// Multi-language text field connected to react-hook-form.
// The form value is { en: "...", fr: "...", ... } with one entry per language in config.languages.
// The current language comes first; "rules" apply to it. Other languages have a translate button.
//
//   <TypeLang control={control} name="title" label={t("product.title")} rules={productValidation.title} />
//   <TypeLang control={control} name="description" label={t("product.description")} type="textarea" />

import { ConstValue } from "dff-util";
import { useId, type ReactElement } from "react";
import { useController, type Control, type FieldValues, type Path } from "react-hook-form";
import { useUi } from "../context/use-ui.ts";
import type { LanguageOption } from "../interfaces/ui-config.ts";
import { joinClassNames } from "./class-names.ts";
import { readFieldErrorText } from "./field-error.ts";
import type { TypeFieldProps } from "./field-props.ts";
import { registerFieldBinding, translatingFieldPathSignal } from "./field-registry.ts";
import { handleTranslateButtonClick, orderLanguagesForEditing, readLanguageFieldPath } from "./lang-field.ts";
import { TypeIcon } from "./type.icon.ts";

export type LangInputType = "text" | "textarea";

export interface TypeLangProps<TFieldValues extends FieldValues> extends TypeFieldProps<TFieldValues> {
  /** "text" (default) or "textarea". */
  type?: LangInputType;
  /** Show translate buttons. Default true. */
  isTranslatable?: boolean;
}

interface LangInputRowProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  fieldName: string;
  language: LanguageOption;
  currentLanguageCode: string;
  type: LangInputType;
  isCurrent: boolean;
  isTranslatable: boolean;
  isDisabled: boolean;
  rules: TypeFieldProps<TFieldValues>["rules"];
}

/** One language row: language name, translate button and the input. */
function LangInputRow<TFieldValues extends FieldValues>(props: LangInputRowProps<TFieldValues>) {
  const { control, fieldName, language, currentLanguageCode, type, isCurrent, isTranslatable, isDisabled, rules } = props;
  const { t } = useUi();
  const inputId = useId();
  const fieldPath = readLanguageFieldPath(fieldName, language.code);
  const sourcePath = readLanguageFieldPath(fieldName, currentLanguageCode);
  const controllerName = fieldPath as Path<TFieldValues>;
  const controllerRules = isCurrent ? rules : undefined;
  const controllerOptions = { control: control, name: controllerName, rules: controllerRules, disabled: isDisabled };
  const { field, fieldState } = useController(controllerOptions);
  const binding = { value: field.value, onChange: field.onChange };
  registerFieldBinding(fieldPath, binding);
  const isTranslating = translatingFieldPathSignal.value === fieldPath;
  const errorText = readFieldErrorText(fieldState.error, t);
  const hasError = Boolean(errorText);
  const value = field.value ?? ConstValue.EMPTY;
  const translateText = t("ui.translate");
  const showTranslate = isTranslatable && !isCurrent;
  const inputClassList = [type === "textarea" ? "textarea w-full" : "input w-full", hasError ? (type === "textarea" ? "textarea-error" : "input-error") : ""];
  const inputClassName = joinClassNames(inputClassList);
  const isInputDisabled = field.disabled || isTranslating;

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 text-xs">
        <label htmlFor={inputId} className="font-medium opacity-70" lang={language.code}>
          {language.flag ? `${language.flag} ` : null}
          {language.label}
        </label>
        {showTranslate ? (
          <button
            type="button"
            className="btn btn-ghost btn-xs gap-1"
            title={translateText}
            data-source-path={sourcePath}
            data-target-path={fieldPath}
            data-source-lang={currentLanguageCode}
            data-target-lang={language.code}
            onClick={handleTranslateButtonClick}
            disabled={isInputDisabled}
          >
            {isTranslating ? <span className="loading loading-spinner loading-xs" /> : <TypeIcon name="Languages" size={14} />}
            {translateText}
          </button>
        ) : null}
      </div>
      {type === "textarea" ? (
        <textarea
          id={inputId}
          ref={field.ref}
          name={field.name}
          rows={3}
          lang={language.code}
          value={value}
          onChange={field.onChange}
          onBlur={field.onBlur}
          disabled={isInputDisabled}
          className={inputClassName}
          aria-invalid={hasError}
        />
      ) : (
        <input
          id={inputId}
          ref={field.ref}
          name={field.name}
          type="text"
          lang={language.code}
          value={value}
          onChange={field.onChange}
          onBlur={field.onBlur}
          disabled={isInputDisabled}
          className={inputClassName}
          aria-invalid={hasError}
        />
      )}
      {errorText ? <p className="text-xs text-error">{errorText}</p> : null}
    </div>
  );
}

export function TypeLang<TFieldValues extends FieldValues>(props: TypeLangProps<TFieldValues>) {
  const { control, name, label, rules, hint, disabled = false, className, type = "text", isTranslatable = true } = props;
  const { languages, locale } = useUi();
  const orderedLanguages = orderLanguagesForEditing(languages, locale);
  const rows: ReactElement[] = [];
  for (const language of orderedLanguages) {
    const isCurrent = language.code === locale;
    const row = (
      <LangInputRow
        key={language.code}
        control={control}
        fieldName={name}
        language={language}
        currentLanguageCode={locale}
        type={type}
        isCurrent={isCurrent}
        isTranslatable={isTranslatable}
        isDisabled={disabled}
        rules={rules}
      />
    );
    rows.push(row);
  }
  const classList = ["fieldset", className];
  const wrapperClassName = joinClassNames(classList);

  return (
    <fieldset className={wrapperClassName}>
      <legend className="fieldset-legend">{label}</legend>
      <div className="flex max-h-96 flex-col gap-3 overflow-y-auto rounded-box border border-base-300 bg-base-100 p-3">{rows}</div>
      {hint ? <p className="label">{hint}</p> : null}
    </fieldset>
  );
}
