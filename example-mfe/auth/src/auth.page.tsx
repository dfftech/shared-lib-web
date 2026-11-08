// auth.page.tsx — the auth MFE: the login page (AuthLayout + form). The shell has NO login of its own: while nobody
// is signed in it shows this MFE (env.mfe.js entry with isAuth: true), whatever the address.
//   Sign in -> startSession(token, user) here; the library fires SESSION_EVENT, the shell's library copy reads the
//   session, the shell shows its layout and menu, and single-spa unmounts this MFE.
//   Alone (npm run dev): after sign in it shows who is signed in and a sign-out button.

import { ConstKeys, RegExp, AppUUID4 } from "dff-util";
import { TypeButton, TypeInput, authUserSignal, endSession, isAuthenticatedSignal, startSession, useUi } from "shared-lib-web";
import { AuthLayout } from "shared-lib-web/layout";
import { useForm } from "react-hook-form";
import type { MfeProps } from "./mfe-lifecycles.ts";
import { MfePage } from "./mfe-page.tsx";

/** Login email: required + a valid address (dff-util messages, translated in the root texts). */
const emailRules = {
  required: { value: true, message: ConstKeys.REQUIRED },
  pattern: { value: RegExp.EMAIL, message: ConstKeys.INVALID_EMAIL },
};

interface LoginFormType {
  email: string;
}

/**
 * Fake sign in: any email. A real auth MFE calls the login API and saves its token.
 * persona + roles: the shell's menu request (sor /authorization/<persona>?roles=...); id: branches (?profile=).
 */
function handleLoginSubmit(values: LoginFormType): void {
  const token = AppUUID4();
  const user = { id: values.email, email: values.email, name: values.email, persona: "admin", roles: ["ADMIN_ADMIN"] };
  startSession(token, user);
}

/** Sign out (only shown when the MFE runs alone; in the shell the shell's user menu signs out). */
function handleSignOut(): void {
  endSession([], false);
}

function LoginForm() {
  const { t } = useUi();
  const formOptions = { defaultValues: { email: "" } };
  const form = useForm<LoginFormType>(formOptions);
  const onSubmit = form.handleSubmit(handleLoginSubmit);
  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-2">
      <h1 className="text-2xl font-bold text-primary">{t("login.title")}</h1>
      <p className="mb-2 text-sm opacity-70">{t("login.hint")}</p>
      <TypeInput control={form.control} name="email" type="email" label={t("login.email")} rules={emailRules} />
      <TypeButton type="submit" icon="LogIn" label={t("login.submit")} isBlock />
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
