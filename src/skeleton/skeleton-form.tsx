// skeleton-form.tsx
// Placeholder for a form: label + input pairs in a responsive grid, a text area and a button.

import type { ReactElement } from "react";

export interface SkeletonFormProps {
  /** Number of input fields. Default 6. */
  fields?: number;
  /** Show the big text area placeholder. Default true. */
  showTextArea?: boolean;
  /** Show the submit button placeholder. Default true. */
  showSubmit?: boolean;
}

/** Builds the label + input placeholders. */
function buildFieldRows(fieldCount: number): ReactElement[] {
  const rows: ReactElement[] = [];
  for (let fieldIndex = 0; fieldIndex < fieldCount; fieldIndex += 1) {
    const row = (
      <div key={fieldIndex} className="flex flex-col gap-2">
        <div className="skeleton h-4 w-24" />
        <div className="skeleton h-10 w-full" />
      </div>
    );
    rows.push(row);
  }
  return rows;
}

export function SkeletonForm(props: SkeletonFormProps) {
  const { fields = 6, showTextArea = true, showSubmit = true } = props;
  const rows = buildFieldRows(fields);
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{rows}</div>
      {showTextArea ? (
        <div className="flex flex-col gap-2">
          <div className="skeleton h-4 w-32" />
          <div className="skeleton h-28 w-full" />
        </div>
      ) : null}
      {showSubmit ? <div className="skeleton h-10 w-32 self-end" /> : null}
    </div>
  );
}
