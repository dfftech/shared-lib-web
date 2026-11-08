// login.view.ts — TypeScript only: who is signed in and the sign-out button (when the MFE runs alone).
import { useUi, type TranslateFunction, type TypeButtonProps } from "shared-lib-web";
import { endUserSession, sessionEmail } from "../hooks/service.ts";

export interface LoginViewModel {
  emailText: string;
  signOutProps: TypeButtonProps;
}

function buildSignOutProps(t: TranslateFunction): TypeButtonProps {
  return { icon: "LogOut", label: t("ui.logout"), onPress: endUserSession };
}

export function useLoginView(): LoginViewModel {
  const { t } = useUi();
  return { emailText: sessionEmail.value, signOutProps: buildSignOutProps(t) };
}
