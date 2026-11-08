// auth.page.tsx — the auth MFE: the login page (AuthLayout + form). The shell has NO login of its own: while nobody
// is signed in it shows this MFE (env.mfe.js entry with isAuth: true), whatever the address.
//   Sign in -> POST sor/auth-signin (user id + base64 password, auth.service.ts) -> startSession(token, user); the library fires SESSION_EVENT, the shell's library copy reads the
//   session, the shell shows its layout and menu, and single-spa unmounts this MFE.
//   Alone (npm run dev): after sign in it shows who is signed in and a sign-out button.

import { ConstKeys, RegExp } from "dff-util";
import { ShowToast, TypeButton, TypeInput, authUserSignal, endSession, isAuthenticatedSignal, readErrorMessage, useUi } from "shared-lib-web";
import { AuthLayout } from "shared-lib-web/layout";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { signIn, type SignInValues } from "./auth.service.ts";
import type { MfeProps } from "./mfe-lifecycles.ts";
import { MfePage } from "./mfe-page.tsx";

/** Login email: required + a valid address (dff-util messages, translated in the root texts). */
const emailRules = {
  required: { value: true, message: ConstKeys.REQUIRED },
  pattern: { value: RegExp.EMAIL, message: ConstKeys.INVALID_EMAIL },
};

/** Password: required (sent as base64, see auth.service.ts). */
const passwordRules = {
  required: { value: true, message: ConstKeys.REQUIRED },
};

const EMPTY_VALUES: SignInValues = { email: "", password: "" };

/**
 * A failed sign in: the backend's message ({ message } or { error: { message } }, e.g. "Invalid credentials, please
 * try again"); login.failed from the texts when the reply has none.
 */
function showSignInError(error: unknown, failedText: string): void {
  const message = readErrorMessage(error, failedText);
  ShowToast(message, "error");
}

/** Sign out (only shown when the MFE runs alone; in the shell the shell's user menu signs out). */
function handleSignOut(): void {
  endSession([], false);
}

/** POST sor/auth-signin; on success the library signs the shell in (SESSION_EVENT) and this MFE is unmounted. */
async function submitSignIn(setIsBusy: (isBusy: boolean) => void, failedText: string, values: SignInValues): Promise<void> {
  setIsBusy(true);
  try {
    await signIn(values);
  } catch (error) {
    showSignInError(error, failedText);
    setIsBusy(false);
  }
}

function LoginForm() {
  const { t } = useUi();
  const [isBusy, setIsBusy] = useState(false);
  const formOptions = { defaultValues: EMPTY_VALUES };
  const form = useForm<SignInValues>(formOptions);
  const failedText = t("login.failed");
  const submit = submitSignIn.bind(null, setIsBusy, failedText);
  const onSubmit = form.handleSubmit(submit);
  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-2">
      <h1 className="text-2xl font-bold text-primary">{t("login.title")}</h1>
      <p className="mb-2 text-sm opacity-70">{t("login.hint")}</p>
      <TypeInput control={form.control} name="email" type="email" autoComplete="username" label={t("login.email")} rules={emailRules} />
      <TypeInput control={form.control} name="password" type="password" autoComplete="current-password" label={t("login.password")} rules={passwordRules} />
      <TypeButton type="submit" icon="LogIn" label={t("login.submit")} isBlock isLoading={isBusy} />
    </form>
  );
}

/** Alone, after sign in: who is signed in (in the shell this MFE is unmounted by then). */
function SignedInNote() {
  const email = authUserSignal.value?.email ?? "";
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm" dir="ltr">{email}</p>
      <TypeButton icon="LogOut" label="Sign out" onPress={handleSignOut} />
    </div>
  );
}

function AuthPage() {
  useUi();
  const isSignedIn = isAuthenticatedSignal.value;
  return <AuthLayout>{isSignedIn ? <SignedInNote /> : <LoginForm />}</AuthLayout>;
}

/** Root component of the auth MFE. */
export function AuthMfe(props: MfeProps) {
  const isInShell = Boolean(props.singleSpa);
  return (
    <MfePage isInShell={isInShell}>
      <AuthPage />
    </MfePage>
  );
}
