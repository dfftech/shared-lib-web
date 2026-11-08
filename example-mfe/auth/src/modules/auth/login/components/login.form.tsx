// login.form.tsx — view only.
import { TypeButton, TypeInput } from "shared-lib-web";
import { useLoginForm } from "./login.form.ts";

export function LoginForm() {
  const model = useLoginForm();
  return (
    <form onSubmit={model.onSubmit} noValidate className="flex flex-col gap-2">
      <h1 className="text-2xl font-bold text-primary">{model.titleText}</h1>
      <p className="mb-2 text-sm opacity-70">{model.hintText}</p>
      <TypeInput {...model.emailProps} />
      <TypeInput {...model.passwordProps} />
      <TypeButton {...model.submitProps} />
    </form>
  );
}
