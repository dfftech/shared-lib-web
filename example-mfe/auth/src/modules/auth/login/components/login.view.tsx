// login.view.tsx — view only: shown after sign in when the MFE runs alone (in the shell it is unmounted by then).
import { TypeButton } from "shared-lib-web";
import { useLoginView } from "./login.view.ts";

export function LoginView() {
  const model = useLoginView();
  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm" dir="ltr">{model.emailText}</p>
      <TypeButton {...model.signOutProps} />
    </div>
  );
}
