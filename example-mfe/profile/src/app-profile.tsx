// app-profile.tsx — root component of the profile MFE: provider (MfePage) + Suspense + access check only.
import { RequireAccess, SkeletonForm } from "shared-lib-web";
import { Suspense } from "react";
import type { MfeProps } from "./mfe-lifecycles.ts";
import { MfePage } from "./mfe-page.tsx";
import { ProfilePage } from "./modules/profile/profile.page.tsx";

export function ProfileMfe(props: MfeProps) {
  const isInShell = Boolean(props.singleSpa);
  const pageFallback = <SkeletonForm />;
  return (
    <MfePage isInShell={isInShell}>
      <Suspense fallback={pageFallback}>
        <RequireAccess>
          <ProfilePage />
        </RequireAccess>
      </Suspense>
    </MfePage>
  );
}
