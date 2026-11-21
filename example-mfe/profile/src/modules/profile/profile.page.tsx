// profile.page.tsx — the profile view + the edit form in a side drawer (no auth here: app-profile.tsx checks it).
import { useSignals } from "@preact/signals-react/runtime";
import { TypeDrawer, useUi } from "shared-lib-web";
import { useEffect } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { ContentLayout, TypeDataView } from "shared-lib-web";
import { ProfileForm } from "./components/profile.form.tsx";
import { ProfileView } from "./components/profile.view.tsx";
import { closeProfileEdit, profileIsEditOpen } from "./hooks/service.ts";
import { roleLoadCall } from "./hooks/service-load.ts";

const RUN_ONCE: never[] = [];

interface ProfileDataRow {
  id: string;
  label: string;
  value: string;
}

const profileDataRows: ProfileDataRow[] = [
  { id: "1", label: "Profile", value: "Primary account" },
  { id: "2", label: "Status", value: "Active" },
  { id: "3", label: "Access", value: "Standard" },
];

const profileDataColumns: ColumnDef<ProfileDataRow>[] = [
  { accessorKey: "label", header: "Label" },
  { accessorKey: "value", header: "Value" },
];

export function ProfilePage() {
  useSignals();
  const { t } = useUi();
  useEffect(roleLoadCall, RUN_ONCE);
  const isEditOpen = profileIsEditOpen.value;
  const editTitle = t("profile.edit");
  return (
    <>
      <ProfileView />
      <TypeDrawer isOpen={isEditOpen} side="end" size="md" title={editTitle} onClose={closeProfileEdit}>
        {isEditOpen ? <ProfileForm /> : null}
      </TypeDrawer>
      <ContentLayout>
        <h3 className="mb-3 font-semibold">TypeDataView in an MFE</h3>
        <TypeDataView
          data={profileDataRows}
          columns={profileDataColumns}
          rendering="client"
          initialState={{ sorting: [] }}
          height={220}
        />
      </ContentLayout>
    </>
  );
}
