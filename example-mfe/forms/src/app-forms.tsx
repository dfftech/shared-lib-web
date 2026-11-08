// app-forms.tsx — root component of the forms MFE: provider (MfePage) + Suspense + access check only.
import { RequireAccess, SkeletonForm } from "shared-lib-web";
import { Suspense } from "react";
import type { MfeProps } from "./mfe-lifecycles.ts";
import { MfePage } from "./mfe-page.tsx";
import { FormsPage } from "./modules/forms/forms.page.tsx";

export function FormsMfe(props: MfeProps) {
  const isInShell = Boolean(props.singleSpa);
  const pageFallback = <SkeletonForm />;
  return (
    <MfePage isInShell={isInShell}>
      <Suspense fallback={pageFallback}>
        <RequireAccess>
          <FormsPage />
        </RequireAccess>
      </Suspense>
    </MfePage>
  );
}
