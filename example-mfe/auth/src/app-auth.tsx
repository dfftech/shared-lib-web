// app-auth.tsx — root component of the auth MFE: provider (MfePage) + Suspense. No access check: the login is for
// signed-out users.
import { SkeletonAuthForm } from "shared-lib-web";
import { Suspense } from "react";
import type { MfeProps } from "./mfe-lifecycles.ts";
import { MfePage } from "./mfe-page.tsx";
import { LoginPage } from "./modules/auth/login/login.page.tsx";

export function AuthMfe(props: MfeProps) {
  const isInShell = Boolean(props.singleSpa);
  const pageFallback = <SkeletonAuthForm />;
  return (
    <MfePage isInShell={isInShell}>
      <Suspense fallback={pageFallback}>
        <LoginPage />
      </Suspense>
    </MfePage>
  );
}
