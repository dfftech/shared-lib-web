// forms.form.ts — TypeScript only: form set-up and the props of the Type* controls.
import {
  useUi,
  type TranslateFunction,
  type TypeButtonProps,
  type TypeDateProps,
  type TypeInputProps,
  type TypeSelectProps,
  type TypeSwitchProps,
  type TypeTextAreaProps,
} from "shared-lib-web";
import type { OptionType } from "dff-util";
import type { FormEventHandler } from "react";
import { useForm, type Control } from "react-hook-form";
import { getDefaultContact } from "../hooks/data.ts";
import { CONTACT_FORM_ID, contactCancel, contactSubmitted, setContactReset, submittedContact } from "../hooks/service.ts";
import { roleOptions } from "../hooks/service-load.ts";
import type { ContactType } from "../hooks/types.ts";
import { contactValidation } from "../hooks/validation.ts";

export interface FormsFormModel {
  titleText: string;
  formId: string;
  nameProps: TypeInputProps<ContactType>;
  emailProps: TypeInputProps<ContactType>;
  roleProps: TypeSelectProps<ContactType>;
  startDateProps: TypeDateProps<ContactType>;
  activeProps: TypeSwitchProps<ContactType>;
  notesProps: TypeTextAreaProps<ContactType>;
  cancelProps: TypeButtonProps;
  submitProps: TypeButtonProps;
  valuesTitle: string;
  /** The last submitted values as JSON ("" = nothing submitted yet). */
  submittedJson: string;
  onSubmit: FormEventHandler<HTMLFormElement>;
}

function buildNameProps(control: Control<ContactType>, t: TranslateFunction): TypeInputProps<ContactType> {
  return { control: control, name: "name", label: t("forms.name"), rules: contactValidation.name };
}

function buildEmailProps(control: Control<ContactType>, t: TranslateFunction): TypeInputProps<ContactType> {
  return { control: control, name: "email", type: "email", label: t("forms.email"), rules: contactValidation.email };
}

function buildRoleProps(control: Control<ContactType>, t: TranslateFunction, options: OptionType[]): TypeSelectProps<ContactType> {
  return { control: control, name: "role", label: t("forms.role"), options: options, rules: contactValidation.role };
}

function buildStartDateProps(control: Control<ContactType>, t: TranslateFunction): TypeDateProps<ContactType> {
  return { control: control, name: "startDate", label: t("forms.startDate") };
}

function buildActiveProps(control: Control<ContactType>, t: TranslateFunction): TypeSwitchProps<ContactType> {
  return { control: control, name: "isActive", label: t("forms.active") };
}

function buildNotesProps(control: Control<ContactType>, t: TranslateFunction): TypeTextAreaProps<ContactType> {
  return { control: control, name: "notes", label: t("forms.notes") };
}

function buildCancelProps(t: TranslateFunction): TypeButtonProps {
  return { action: "ghost", icon: "X", label: t("forms.cancel"), onPress: contactCancel };
}

function buildSubmitProps(t: TranslateFunction): TypeButtonProps {
  return { type: "submit", form: CONTACT_FORM_ID, icon: "Send", label: t("forms.submit") };
}

/** The submitted values as readable JSON ("" when nothing was submitted). */
function readSubmittedJson(values: ContactType | null): string {
  return values ? JSON.stringify(values, null, 2) : "";
}

export function useFormsForm(): FormsFormModel {
  const { t } = useUi();
  const defaultValues = getDefaultContact();
  const formOptions = { defaultValues: defaultValues };
  const form = useForm<ContactType>(formOptions);
  setContactReset(form.reset);
  const onSubmit = form.handleSubmit(contactSubmitted);
  const control = form.control;
  const submitted = submittedContact.value;
  const options = roleOptions.value;

  return {
    titleText: t("forms.title"),
    formId: CONTACT_FORM_ID,
    nameProps: buildNameProps(control, t),
    emailProps: buildEmailProps(control, t),
    roleProps: buildRoleProps(control, t, options),
    startDateProps: buildStartDateProps(control, t),
    activeProps: buildActiveProps(control, t),
    notesProps: buildNotesProps(control, t),
    cancelProps: buildCancelProps(t),
    submitProps: buildSubmitProps(t),
    valuesTitle: t("forms.values"),
    submittedJson: readSubmittedJson(submitted),
    onSubmit: onSubmit,
  };
}
