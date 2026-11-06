// user.form.ts — TypeScript only: react-hook-form set-up and props for the Type* controls.
import {
  ShowToast,
  translate,
  useUi,
  type TranslateFunction,
  type TypeButtonProps,
  type TypeInputProps,
  type TypeSelectProps,
  type TypeSwitchProps,
  type TypeTextAreaProps,
} from "shared-lib-web";
import type { FormEventHandler } from "react";
import { useForm, type Control } from "react-hook-form";
import { getDefaultUser } from "../hooks/data.ts";
import { SelectedUser, closeUserPopup, editModeUpdate } from "../hooks/service.ts";
import { userListCall, userSaveCall, userSaveIsLoading } from "../hooks/service-http.ts";
import { countryOptions, roleOptions } from "../hooks/service-load.ts";
import type { UserType } from "../hooks/types.ts";
import { userValidation } from "../hooks/validation.ts";

export interface UserFormModel {
  nameProps: TypeInputProps<UserType>;
  emailProps: TypeInputProps<UserType>;
  phoneProps: TypeInputProps<UserType>;
  roleProps: TypeSelectProps<UserType>;
  countryProps: TypeSelectProps<UserType>;
  activeProps: TypeSwitchProps<UserType>;
  notesProps: TypeTextAreaProps<UserType>;
  saveProps: TypeButtonProps;
  cancelProps: TypeButtonProps;
  onSubmit: FormEventHandler<HTMLFormElement>;
}

export async function handleUserSave(values: UserType): Promise<void> {
  const savedUser = await userSaveCall(values);
  const message = translate("user.saved");
  ShowToast(message, "success");
  await userListCall();
  await editModeUpdate(savedUser.id);
}

function buildNameProps(control: Control<UserType>, t: TranslateFunction): TypeInputProps<UserType> {
  return { control: control, name: "name", label: t("user.name"), rules: userValidation.name };
}

function buildEmailProps(control: Control<UserType>, t: TranslateFunction): TypeInputProps<UserType> {
  return { control: control, name: "email", type: "email", label: t("user.email"), rules: userValidation.email };
}

function buildPhoneProps(control: Control<UserType>, t: TranslateFunction): TypeInputProps<UserType> {
  return { control: control, name: "phone", type: "tel", label: t("user.phone"), rules: userValidation.phone };
}

function buildRoleProps(control: Control<UserType>, t: TranslateFunction): TypeSelectProps<UserType> {
  return { control: control, name: "role", label: t("user.role"), options: roleOptions.value, rules: userValidation.role };
}

function buildCountryProps(control: Control<UserType>, t: TranslateFunction): TypeSelectProps<UserType> {
  return { control: control, name: "country", label: t("user.country"), options: countryOptions.value, rules: userValidation.country };
}

function buildActiveProps(control: Control<UserType>, t: TranslateFunction): TypeSwitchProps<UserType> {
  return { control: control, name: "active", label: t("user.active") };
}

function buildNotesProps(control: Control<UserType>, t: TranslateFunction): TypeTextAreaProps<UserType> {
  return { control: control, name: "notes", label: t("user.notes"), rules: userValidation.notes, rows: 3 };
}

function buildSaveProps(t: TranslateFunction, isLoading: boolean): TypeButtonProps {
  return { action: "primary", type: "submit", label: t("user.save"), icon: "Save", isLoading: isLoading };
}

function buildCancelProps(t: TranslateFunction): TypeButtonProps {
  return { action: "ghost", label: t("user.cancel"), icon: "X", onPress: closeUserPopup };
}

export function useUserForm(): UserFormModel {
  const { t } = useUi();
  const selectedUser = SelectedUser.value;
  const defaultUser = getDefaultUser();
  const defaultValues = selectedUser ?? defaultUser;
  const formOptions = { defaultValues: defaultValues };
  const form = useForm<UserType>(formOptions);
  const control = form.control;
  const isSaving = userSaveIsLoading.value;
  const onSubmit = form.handleSubmit(handleUserSave);

  return {
    nameProps: buildNameProps(control, t),
    emailProps: buildEmailProps(control, t),
    phoneProps: buildPhoneProps(control, t),
    roleProps: buildRoleProps(control, t),
    countryProps: buildCountryProps(control, t),
    activeProps: buildActiveProps(control, t),
    notesProps: buildNotesProps(control, t),
    saveProps: buildSaveProps(t, isSaving),
    cancelProps: buildCancelProps(t),
    onSubmit: onSubmit,
  };
}
