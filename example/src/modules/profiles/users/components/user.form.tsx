// user.form.tsx — view only (shown inside the TypeDrawer of user.page.tsx).
import { TypeButton, TypeInput, TypeSelect, TypeSwitch, TypeTextArea } from "shared-lib-web";
import { useUserForm } from "./user.form.ts";

export function UserForm() {
  const { nameProps, emailProps, phoneProps, roleProps, countryProps, activeProps, notesProps, saveProps, cancelProps, onSubmit } =
    useUserForm();

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-2">
      <div className="grid grid-cols-1 gap-x-4 md:grid-cols-2">
        <TypeInput {...nameProps} />
        <TypeInput {...emailProps} />
        <TypeInput {...phoneProps} />
        <TypeSelect {...roleProps} />
        <TypeSelect {...countryProps} />
        <TypeSwitch {...activeProps} />
      </div>
      <TypeTextArea {...notesProps} />
      <div className="mt-2 flex justify-end gap-2">
        <TypeButton {...cancelProps} />
        <TypeButton {...saveProps} />
      </div>
    </form>
  );
}
