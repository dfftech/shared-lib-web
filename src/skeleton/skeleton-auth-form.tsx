// skeleton-auth-form.tsx
// Placeholder for login / sign-up / forgot-password forms inside AuthLayout.

import { SkeletonForm } from "./skeleton-form.tsx";

export interface SkeletonAuthFormProps {
  /** Number of fields. Default 2 (email + password). */
  fields?: number;
}

export function SkeletonAuthForm(props: SkeletonAuthFormProps) {
  const { fields = 2 } = props;
  return (
    <div className="flex flex-col gap-4" aria-hidden="true">
      <div className="skeleton mx-auto h-6 w-32" />
      <SkeletonForm fields={fields} showTextArea={false} showSubmit={false} />
      <div className="skeleton h-10 w-full" />
    </div>
  );
}
