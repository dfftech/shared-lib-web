// login.page.tsx — the login page: AuthLayout (language, theme, brand) + the form, or who is signed in.
// The shell has NO login of its own: while nobody is signed in it shows this MFE (env.mfe.js entry with isAuth: true).
import { useSignals } from "@preact/signals-react/runtime";
import { AuthLayout } from "shared-lib-web/layout";
import { LoginForm } from "./components/login.form.tsx";
import { LoginView } from "./components/login.view.tsx";
import { isLoggedIn } from "./hooks/service.ts";

export function LoginPage() {
  useSignals();
  const isSignedIn = isLoggedIn.value;
  return <AuthLayout>{isSignedIn ? <LoginView /> : <LoginForm />}</AuthLayout>;
}
