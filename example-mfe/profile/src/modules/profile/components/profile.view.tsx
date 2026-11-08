// profile.view.tsx — view only: HeadLayout (Edit) + ContentLayout with the photo and the profile rows.
import { ContentLayout, HeadLayout, TypeButton, TypeImage } from "shared-lib-web";
import type { ReactElement } from "react";
import type { ProfileRowType } from "../hooks/types.ts";
import { useProfileView } from "./profile.view.ts";

function ProfileRow(props: ProfileRowType) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-base-300/70 py-2 last:border-b-0">
      <dt className="text-xs opacity-60">{props.label}</dt>
      <dd className="font-medium">{props.value}</dd>
    </div>
  );
}

function buildRowElements(rows: ProfileRowType[]): ReactElement[] {
  const elements: ReactElement[] = [];
  for (const row of rows) {
    elements.push(<ProfileRow key={row.label} label={row.label} value={row.value} />);
  }
  return elements;
}

export function ProfileView() {
  const model = useProfileView();
  const rowElements = buildRowElements(model.rows);
  const headActions = <TypeButton {...model.editProps} />;
  return (
    <>
      <HeadLayout title={model.titleText} actions={headActions} />
      <ContentLayout>
        <div className="flex flex-col gap-6 md:flex-row">
          <TypeImage {...model.photoProps} />
          <dl className="grid flex-1 grid-cols-1 gap-x-8 md:grid-cols-2">{rowElements}</dl>
        </div>
      </ContentLayout>
    </>
  );
}
