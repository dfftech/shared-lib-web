// profile.page.tsx — the profile view + the edit form in a side drawer (no auth here: app-profile.tsx checks it).
import { useSignals } from "@preact/signals-react/runtime";
import { TypeDrawer, useUi } from "shared-lib-web";
import { useEffect } from "react";
import { ProfileForm } from "./components/profile.form.tsx";
import { ProfileView } from "./components/profile.view.tsx";
import { closeProfileEdit, profileIsEditOpen } from "./hooks/service.ts";
import { roleLoadCall } from "./hooks/service-load.ts";

const RUN_ONCE: never[] = [];

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
    </>
  );
}
