// field-props.ts
// Props shared by every react-hook-form control (TypeInput, TypeSelect, TypeSwitch ...).

import type { Control, FieldError, FieldValues, Path, UseControllerProps } from "react-hook-form";

export interface TypeFieldProps<TFieldValues extends FieldValues> {
  /** control from useForm(). */
  control: Control<TFieldValues>;
  /** Field name, for example "email". */
  name: Path<TFieldValues>;
  /** Visible label (already translated). */
  label: string;
  /** Validation rules. Use dff-util ConstKeys as messages and RegExp as patterns. */
  rules?: UseControllerProps<TFieldValues>["rules"];
  /** Optional error from formState.errors. When missing, the field's own error is used. */
  error?: FieldError;
  /** Small help text under the field (already translated). */
  hint?: string;
  /** Disables the field. */
  disabled?: boolean;
  /** Extra class names for the wrapper. */
  className?: string;
}
