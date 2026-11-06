// type.lang-md.tsx
// TypeLangMd: multi-language markdown field connected to react-hook-form.
// The form value is { en: "...", fr: "...", ... }, one markdown text per language in config.languages.
// The current language comes first; "rules" apply to it. Other languages have a translate button.
// Import from "shared-lib-web/markdown".
//
//   <TypeLangMd control={control} name="content" label={t("page.content")} height={250} />

import MDEditor from "@uiw/react-md-editor";
import { ConstValue } from "dff-util";
import type { ReactElement } from "react";
import { useController, type Control, type FieldValues, type Path } from "react-hook-form";
import { useUi } from "../context/use-ui.ts";
import type { LanguageOption } from "../interfaces/ui-config.ts";
import { joinClassNames } from "./class-names.ts";
import { readFieldErrorText } from "./field-error.ts";
import type { TypeFieldProps } from "./field-props.ts";
import { registerFieldBinding, translatingFieldPathSignal } from "./field-registry.ts";
import { handleTranslateButtonClick, orderLanguagesForEditing, readLanguageFieldPath } from "./lang-field.ts";
import { TypeIcon } from "./type.icon.ts";
import { readMarkdownColorMode } from "./markdown-color-mode.ts";

export interface TypeLangMdProps<TFieldValues extends FieldValues> extends TypeFieldProps<TFieldValues> {
  /** Editor height in px per language. Default 220. */
  height?: number;
  /** Show translate buttons. Default true. */
  isTranslatable?: boolean;
}

interface LangMarkdownRowProps<TFieldValues extends FieldValues> {
  control: Control<TFieldValues>;
  fieldName: string;
  language: LanguageOption;
  currentLanguageCode: string;
  isCurrent: boolean;
  isTranslatable: boolean;
  isDisabled: boolean;
  height: number;
  rules: TypeFieldProps<TFieldValues>["rules"];
}

/** One language: name, translate button and a markdown editor. */
function LangMarkdownRow<TFieldValues extends FieldValues>(props: LangMarkdownRowProps<TFieldValues>) {
  const { control, fieldName, language, currentLanguageCode, isCurrent, isTranslatable, isDisabled, height, rules } = props;
  const { t } = useUi();
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
  const value = field.value ?? ConstValue.EMPTY;
  const translateText = t("ui.translate");
  const showTranslate = isTranslatable && !isCurrent;
  const colorMode = readMarkdownColorMode();
  const isEditorDisabled = Boolean(field.disabled) || isTranslating;
  const textareaProps = { disabled: isEditorDisabled, name: field.name, onBlur: field.onBlur, lang: language.code };
  const editorClassName = errorText ? "rounded-box ring-2 ring-error" : "rounded-box";

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 text-xs">
        <span className="font-medium opacity-70" lang={language.code}>
          {language.flag ? `${language.flag} ` : null}
          {language.label}
        </span>
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
            disabled={isEditorDisabled}
          >
            {isTranslating ? <span className="loading loading-spinner loading-xs" /> : <TypeIcon name="Languages" size={14} />}
            {translateText}
          </button>
        ) : null}
      </div>
      <div data-color-mode={colorMode} className={editorClassName}>
        <MDEditor value={value} onChange={field.onChange} height={height} preview="edit" visibleDragbar={false} textareaProps={textareaProps} />
      </div>
      {errorText ? <p className="text-xs text-error">{errorText}</p> : null}
    </div>
  );
}

export function TypeLangMd<TFieldValues extends FieldValues>(props: TypeLangMdProps<TFieldValues>) {
  const { control, name, label, rules, hint, disabled = false, className, height = 220, isTranslatable = true } = props;
  const { languages, locale } = useUi();
  const orderedLanguages = orderLanguagesForEditing(languages, locale);
  const rows: ReactElement[] = [];
  for (const language of orderedLanguages) {
    const isCurrent = language.code === locale;
    const row = (
      <LangMarkdownRow
        key={language.code}
        control={control}
        fieldName={name}
        language={language}
        currentLanguageCode={locale}
        isCurrent={isCurrent}
        isTranslatable={isTranslatable}
        isDisabled={disabled}
        height={height}
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
      <div className="flex flex-col gap-4 rounded-box border border-base-300 bg-base-100 p-3">{rows}</div>
      {hint ? <p className="label">{hint}</p> : null}
    </fieldset>
  );
}
