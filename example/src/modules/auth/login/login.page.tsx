// login.page.tsx — sign-in form (shown by app.tsx while signed out).
import { useUi } from "shared-lib-web";
import { LoginForm } from "./components/login.form.tsx";

export function LoginPage() {
  const { t } = useUi();
  const titleText = t("login.title");
  return (
    <>
      <h2 className="text-center text-lg font-semibold">{titleText}</h2>
      <LoginForm />
    </>
  );
}
