// login.form.tsx — view only.
import { TypeButton, TypeInput, TypeSwitch } from "shared-lib-web";
import { useLoginForm } from "./login.form.ts";

export function LoginForm() {
  const { emailProps, passwordProps, rememberProps, submitProps, hintText, onSubmit } = useLoginForm();
  return (
    <form className="flex flex-col gap-2" onSubmit={onSubmit} noValidate>
      <TypeInput {...emailProps} />
      <TypeInput {...passwordProps} />
      <TypeSwitch {...rememberProps} />
      <TypeButton {...submitProps} />
      <p className="text-center text-sm opacity-70">{hintText}</p>
    </form>
  );
}
