// profile.form.tsx — view only: the edit form inside the drawer.
import { TypeButton, TypeInput, TypeSelect, TypeTextArea } from "shared-lib-web";
import { useProfileForm } from "./profile.form.ts";

export function ProfileForm() {
  const model = useProfileForm();
  return (
    <form id={model.formId} onSubmit={model.onSubmit} noValidate className="flex flex-col gap-1">
      <TypeInput {...model.nameProps} />
      <TypeInput {...model.emailProps} />
      <TypeInput {...model.phoneProps} />
      <TypeSelect {...model.roleProps} />
      <TypeInput {...model.locationProps} />
      <TypeTextArea {...model.aboutProps} />
      <div className="mt-2 flex justify-end gap-2">
        <TypeButton {...model.cancelProps} />
        <TypeButton {...model.saveProps} />
      </div>
    </form>
  );
}
