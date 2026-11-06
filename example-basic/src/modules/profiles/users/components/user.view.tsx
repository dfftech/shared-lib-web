// user.view.tsx — view only (shown inside the TypeDrawer of user.page.tsx).
import { SkeletonForm, TypeButton } from "shared-lib-web";
import type { ReactElement } from "react";
import { useUserView, type UserDetailRow } from "./user.view.ts";

function buildDetailElements(details: UserDetailRow[]): ReactElement[] {
  const elements: ReactElement[] = [];
  for (const detail of details) {
    const element = (
      <div key={detail.label} className="flex flex-col gap-1 border-b border-base-300 py-2">
        <dt className="text-sm opacity-60">{detail.label}</dt>
        <dd className="font-medium">{detail.value || "—"}</dd>
      </div>
    );
    elements.push(element);
  }
  return elements;
}

export function UserView() {
  const { isLoading, details, editProps, deleteProps, canDelete } = useUserView();
  const detailElements = buildDetailElements(details);

  if (isLoading) {
    return <SkeletonForm fields={8} showTextArea={false} showSubmit={false} />;
  }
  return (
    <section className="flex flex-col gap-4">
      <dl>{detailElements}</dl>
      <div className="flex justify-end gap-2">
        {canDelete ? <TypeButton {...deleteProps} /> : null}
        <TypeButton {...editProps} />
      </div>
    </section>
  );
}
