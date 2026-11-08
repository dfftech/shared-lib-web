// profile.form.ts — TypeScript only: the edit form (filled with the current profile) and the Type* props.
import {
  useUi,
  type TranslateFunction,
  type TypeButtonProps,
  type TypeInputProps,
  type TypeSelectProps,
  type TypeTextAreaProps,
} from "shared-lib-web";
import type { OptionType } from "dff-util";
import type { FormEventHandler } from "react";
import { useForm, type Control } from "react-hook-form";
import { PROFILE_FORM_ID, closeProfileEdit, profileSaved, selectedProfile } from "../hooks/service.ts";
import { roleOptions } from "../hooks/service-load.ts";
import type { ProfileType } from "../hooks/types.ts";
import { profileValidation } from "../hooks/validation.ts";

export interface ProfileFormModel {
  formId: string;
  nameProps: TypeInputProps<ProfileType>;
  emailProps: TypeInputProps<ProfileType>;
  phoneProps: TypeInputProps<ProfileType>;
  roleProps: TypeSelectProps<ProfileType>;
  locationProps: TypeInputProps<ProfileType>;
  aboutProps: TypeTextAreaProps<ProfileType>;
  cancelProps: TypeButtonProps;
  saveProps: TypeButtonProps;
  onSubmit: FormEventHandler<HTMLFormElement>;
}

function buildNameProps(control: Control<ProfileType>, t: TranslateFunction): TypeInputProps<ProfileType> {
  return { control: control, name: "name", label: t("profile.name"), rules: profileValidation.name };
}

function buildEmailProps(control: Control<ProfileType>, t: TranslateFunction): TypeInputProps<ProfileType> {
  return { control: control, name: "email", type: "email", label: t("profile.email"), rules: profileValidation.email };
}

function buildPhoneProps(control: Control<ProfileType>, t: TranslateFunction): TypeInputProps<ProfileType> {
  return { control: control, name: "phone", label: t("profile.phone") };
}

function buildRoleProps(control: Control<ProfileType>, t: TranslateFunction, options: OptionType[]): TypeSelectProps<ProfileType> {
  return { control: control, name: "role", label: t("profile.role"), options: options, rules: profileValidation.role };
}

function buildLocationProps(control: Control<ProfileType>, t: TranslateFunction): TypeInputProps<ProfileType> {
  return { control: control, name: "location", label: t("profile.location") };
}

function buildAboutProps(control: Control<ProfileType>, t: TranslateFunction): TypeTextAreaProps<ProfileType> {
  return { control: control, name: "about", label: t("profile.about") };
}

function buildCancelProps(t: TranslateFunction): TypeButtonProps {
  return { action: "ghost", label: t("profile.cancel"), onPress: closeProfileEdit };
}

function buildSaveProps(t: TranslateFunction): TypeButtonProps {
  return { type: "submit", icon: "Save", label: t("profile.save") };
}

export function useProfileForm(): ProfileFormModel {
  const { t } = useUi();
  const defaultValues = selectedProfile.value;
  const formOptions = { defaultValues: defaultValues };
  const form = useForm<ProfileType>(formOptions);
  const onSubmit = form.handleSubmit(profileSaved);
  const control = form.control;
  const options = roleOptions.value;
  return {
    formId: PROFILE_FORM_ID,
    nameProps: buildNameProps(control, t),
    emailProps: buildEmailProps(control, t),
    phoneProps: buildPhoneProps(control, t),
    roleProps: buildRoleProps(control, t, options),
    locationProps: buildLocationProps(control, t),
    aboutProps: buildAboutProps(control, t),
    cancelProps: buildCancelProps(t),
    saveProps: buildSaveProps(t),
    onSubmit: onSubmit,
  };
}
