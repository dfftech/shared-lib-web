// field-registry.ts
// Remembers the current value and change function of language sub-fields (TypeLang, TypeLangMarkdown),
// so the top-level "translate" click handler can read one field and fill another without arrow functions.
// Keys are full field paths, for example "title.fr".

import { signal } from "@preact/signals-react";
import { ConstValue } from "dff-util";

export interface FieldBinding {
  value: unknown;
  onChange: (value: string) => void;
}

const fieldBindings = new Map<string, FieldBinding>();

/** Path of the field that is being translated right now, or "". */
export const translatingFieldPathSignal = signal<string>(ConstValue.EMPTY);

/** Saves the latest value and change function of a field. Called while the field renders. */
export function registerFieldBinding(fieldPath: string, binding: FieldBinding): void {
  fieldBindings.set(fieldPath, binding);
}

/** Returns the saved binding of a field. */
export function readFieldBinding(fieldPath: string): FieldBinding | undefined {
  return fieldBindings.get(fieldPath);
}
