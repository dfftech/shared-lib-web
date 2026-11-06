// type.mdx.tsx
// TypeMdx: markdown EDITOR (@uiw/react-md-editor) connected to react-hook-form. Follows light/dark themes.
// Import from "shared-lib-web/markdown" (needs the optional peer dependency @uiw/react-md-editor).
//
//   <TypeMdx control={control} name="content" label={t("blog.content")} height={400} />

import MDEditor from "@uiw/react-md-editor";
import { ConstValue } from "dff-util";
import { useController, type FieldValues } from "react-hook-form";
import { useUi } from "../context/use-ui.ts";
import { joinClassNames } from "./class-names.ts";
import { readFieldErrorText } from "./field-error.ts";
import type { TypeFieldProps } from "./field-props.ts";
import { readMarkdownColorMode } from "./markdown-color-mode.ts";

export interface TypeMdxProps<TFieldValues extends FieldValues> extends TypeFieldProps<TFieldValues> {
  /** Editor height in px. Default 300. */
  height?: number;
  /** "edit" (default), "live" (editor + preview) or "preview". */
  preview?: "edit" | "live" | "preview";
}

export function TypeMdx<TFieldValues extends FieldValues>(props: TypeMdxProps<TFieldValues>) {
  const { control, name, label, rules, error, hint, disabled, className, height = 300, preview = "edit" } = props;
  const { t } = useUi();
  const controllerOptions = { control: control, name: name, rules: rules, disabled: disabled };
  const { field, fieldState } = useController(controllerOptions);
  const fieldError = error ?? fieldState.error;
  const errorText = readFieldErrorText(fieldError, t);
  const colorMode = readMarkdownColorMode();
  const value = field.value ?? ConstValue.EMPTY;
  const textareaProps = { disabled: field.disabled, name: field.name, onBlur: field.onBlur };
  const classList = ["fieldset", className];
  const wrapperClassName = joinClassNames(classList);
  const editorClassName = errorText ? "rounded-box ring-2 ring-error" : "rounded-box";
  const messageText = errorText ?? hint;

  return (
    <fieldset className={wrapperClassName}>
      <legend className="fieldset-legend">{label}</legend>
      <div data-color-mode={colorMode} className={editorClassName}>
        <MDEditor
          value={value}
          onChange={field.onChange}
          height={height}
          preview={preview}
          visibleDragbar={false}
          textareaProps={textareaProps}
        />
      </div>
      {messageText ? <p className={errorText ? "label text-error" : "label"}>{messageText}</p> : null}
    </fieldset>
  );
}
