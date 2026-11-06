// user.page.tsx — list + side drawer (view or form) + delete confirm. Screen action is applied only here.
import { SkeletonForm, TypeConfirm, TypeDrawer, useUi } from "shared-lib-web";
import { useEffect } from "react";
import { UserForm } from "./components/user.form.tsx";
import { UserList } from "./components/user.list.tsx";
import { UserView } from "./components/user.view.tsx";
import {
  SelectedUser,
  applyScreenAction,
  closeUserDeleteConfirm,
  closeUserPopup,
  handleUserDeleteConfirm,
  userDeleteConfirmOpen,
  userIsEditMode,
  userIsPopupOpen,
} from "./hooks/service.ts";
import { userDeleteIsLoading } from "./hooks/service-http.ts";

const RUN_ONCE: never[] = [];

/** Drawer heading: view, edit or add. */
function readDrawerTitleKey(isEditMode: boolean, isNewUser: boolean): string {
  if (!isEditMode) {
    return "user.viewTitle";
  }
  return isNewUser ? "user.addTitle" : "user.editTitle";
}

export function UserPage() {
  const { t } = useUi();
  useEffect(applyScreenAction, RUN_ONCE);
  const isPopupOpen = userIsPopupOpen.value;
  const isEditMode = userIsEditMode.value;
  const selectedUser = SelectedUser.value;
  const isNewUser = selectedUser !== null && selectedUser.id.length === 0;
  const titleKey = readDrawerTitleKey(isEditMode, isNewUser);
  const drawerTitle = t(titleKey);
  const drawerSubTitle = selectedUser?.email;
  const formKey = selectedUser ? selectedUser.id || "new" : "loading";
  const formElement = selectedUser ? <UserForm key={formKey} /> : <SkeletonForm />;
  const deleteParams = { name: selectedUser?.name ?? "" };

  return (
    <>
      <UserList />
      <TypeDrawer isOpen={isPopupOpen} title={drawerTitle} subTitle={drawerSubTitle} onClose={closeUserPopup}>
        {isEditMode ? formElement : <UserView />}
      </TypeDrawer>
      <TypeConfirm
        isOpen={userDeleteConfirmOpen.value}
        title={t("user.deleteTitle")}
        message={t("user.deleteText", deleteParams)}
        confirmLabel={t("user.delete")}
        tone="error"
        isLoading={userDeleteIsLoading.value}
        onConfirm={handleUserDeleteConfirm}
        onCancel={closeUserDeleteConfirm}
      />
    </>
  );
}
