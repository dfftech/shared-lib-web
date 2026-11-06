// field-error.ts
// Turns a react-hook-form error into translated text.
// Validation messages are translation keys, usually dff-util ConstKeys (REQUIRED, INVALID_EMAIL ...).

import { ConstKeys } from "dff-util";
import type { FieldError } from "react-hook-form";
import type { TranslateFunction } from "../interfaces/ui-context.ts";

/** Returns the translated error text, or undefined when there is no error. */
export function readFieldErrorText(error: FieldError | undefined, t: TranslateFunction): string | undefined {
  if (!error) {
    return undefined;
  }
  const messageKey = error.message;
  if (messageKey) {
    return t(messageKey);
  }
  return t(ConstKeys.INVALID_DATA);
}
