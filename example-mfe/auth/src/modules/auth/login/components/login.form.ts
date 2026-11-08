// login.form.ts — TypeScript only: form set-up and the props of the Type* controls.
import { useUi, type TranslateFunction, type TypeButtonProps, type TypeInputProps } from "shared-lib-web";
import type { FormEventHandler } from "react";
import { useForm, type Control } from "react-hook-form";
import { getDefaultLogin } from "../hooks/data.ts";
import { loginCall, loginIsLoading } from "../hooks/service-http.ts";
import { startUserSession } from "../hooks/service.ts";
import type { LoginType } from "../hooks/types.ts";
import { loginValidation } from "../hooks/validation.ts";

export interface LoginFormModel {
  titleText: string;
  hintText: string;
  emailProps: TypeInputProps<LoginType>;
  passwordProps: TypeInputProps<LoginType>;
  submitProps: TypeButtonProps;
  onSubmit: FormEventHandler<HTMLFormElement>;
}

/** Submit: POST sor/auth-signin; on success start the session (the shell takes over). */
export async function handleLoginSubmit(values: LoginType): Promise<void> {
  const session = await loginCall(values);
  if (session) {
    startUserSession(session);
  }
}

function buildEmailProps(control: Control<LoginType>, t: TranslateFunction): TypeInputProps<LoginType> {
  return {
    control: control,
    name: "email",
    type: "email",
    autoComplete: "username",
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

function buildSubmitProps(t: TranslateFunction, isLoading: boolean): TypeButtonProps {
  return { type: "submit", icon: "LogIn", label: t("login.submit"), isBlock: true, isLoading: isLoading };
}

export function useLoginForm(): LoginFormModel {
  const { t } = useUi();
  const defaultValues = getDefaultLogin();
  const formOptions = { defaultValues: defaultValues };
  const form = useForm<LoginType>(formOptions);
  const onSubmit = form.handleSubmit(handleLoginSubmit);
  const isLoading = loginIsLoading.value;
  return {
    titleText: t("login.title"),
    hintText: t("login.hint"),
    emailProps: buildEmailProps(form.control, t),
    passwordProps: buildPasswordProps(form.control, t),
    submitProps: buildSubmitProps(t, isLoading),
    onSubmit: onSubmit,
  };
}
