// field-wrapper.tsx
// Label + control + error/hint layout used by all Type* form controls (DaisyUI fieldset).

import type { ReactNode } from "react";
import { joinClassNames } from "./class-names.ts";

export interface FieldWrapperProps {
  inputId: string;
  label: string;
  errorText?: string;
  hint?: string;
  className?: string;
  children?: ReactNode;
}

/** id of the message under a field, used for aria-describedby. */
export function readMessageId(inputId: string): string {
  return `${inputId}-message`;
}

export function FieldWrapper(props: FieldWrapperProps) {
  const { inputId, label, errorText, hint, className, children } = props;
  const messageId = readMessageId(inputId);
  const messageText = errorText ?? hint;
  const messageClassName = errorText ? "label text-error" : "label";
  const classList = ["fieldset", className];
  const wrapperClassName = joinClassNames(classList);

  return (
    <fieldset className={wrapperClassName}>
      <label className="fieldset-legend" htmlFor={inputId}>
        {label}
      </label>
      {children}
      {messageText ? (
        <p id={messageId} className={messageClassName}>
          {messageText}
        </p>
      ) : null}
    </fieldset>
  );
}
