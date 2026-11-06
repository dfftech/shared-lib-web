// login.form.ts — TypeScript only: form set-up and props for the Type* controls.
import { ConstKeys } from "dff-util";
import {
  ShowToast,
  translate,
  useUi,
  type TranslateFunction,
  type TypeButtonProps,
  type TypeInputProps,
  type TypeSwitchProps,
} from "shared-lib-web";
import type { FormEventHandler } from "react";
import { useForm, type Control } from "react-hook-form";
import { getDefaultLogin } from "../hooks/data.ts";
import { loginCall, loginIsLoading } from "../hooks/service-http.ts";
import { startSession } from "../hooks/service.ts";
import type { LoginType } from "../hooks/types.ts";
import { loginValidation } from "../hooks/validation.ts";

export interface LoginFormModel {
  emailProps: TypeInputProps<LoginType>;
  passwordProps: TypeInputProps<LoginType>;
  rememberProps: TypeSwitchProps<LoginType>;
  submitProps: TypeButtonProps;
  hintText: string;
  onSubmit: FormEventHandler<HTMLFormElement>;
}

export async function handleLoginSubmit(values: LoginType): Promise<void> {
  const isValid = await loginCall(values);
  if (!isValid) {
    const message = translate(ConstKeys.WENT_WRONG);
    ShowToast(message, "warning");
    return;
  }
  startSession(values.email, values.remember);
}

function buildEmailProps(control: Control<LoginType>, t: TranslateFunction): TypeInputProps<LoginType> {
  return {
    control: control,
    name: "email",
    type: "email",
    autoComplete: "email",
    label: t("login.email"),
    rules: loginValidation.email,
  };
}

function buildPasswordProps(control: Control<LoginType>, t: TranslateFunction): TypeInputProps<LoginType> {
  return {
    control: control,
    name: "password",
    type: "password",
    autoComplete: "current-password",
    label: t("login.password"),
    rules: loginValidation.password,
  };
}

function buildRememberProps(control: Control<LoginType>, t: TranslateFunction): TypeSwitchProps<LoginType> {
  return { control: control, name: "remember", label: t("login.remember"), isCheckbox: true };
}

function buildSubmitProps(t: TranslateFunction, isLoading: boolean): TypeButtonProps {
  return { action: "primary", type: "submit", label: t("login.submit"), icon: "LogIn", isLoading: isLoading, isBlock: true };
}

export function useLoginForm(): LoginFormModel {
  const { t } = useUi();
  const defaultValues = getDefaultLogin();
  const formOptions = { defaultValues: defaultValues };
  const form = useForm<LoginType>(formOptions);
  const isLoading = loginIsLoading.value;
  const onSubmit = form.handleSubmit(handleLoginSubmit);

  return {
    emailProps: buildEmailProps(form.control, t),
    passwordProps: buildPasswordProps(form.control, t),
    rememberProps: buildRememberProps(form.control, t),
    submitProps: buildSubmitProps(t, isLoading),
    hintText: t("login.hint"),
    onSubmit: onSubmit,
  };
}
