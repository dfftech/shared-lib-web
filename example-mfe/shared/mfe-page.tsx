// mfe-page.tsx
// What every MFE renders: the provider (theme, language, menu mode from localStorage) and its page — NO AppLayout.
//   In the shell: the shell's AppLayout <main> already has the padding, so the page is rendered as it is.
//   Alone (npm run dev): a page box with the same padding (p-4 lg:p-6), so HeadLayout looks the same.
//   HeadLayout sticks below the shell header (top-16) in the app layout, and at the very top (top-0) when there is
//   no header: in the aside layout, or when the MFE runs alone.

import { SharedWebUiProvider, isAsideLayoutSignal } from "shared-lib-web";
import { useLayoutEffect, type ReactNode } from "react";
import { config } from "./config.ts";
import { startMfeLayoutChoiceSync } from "./layout-choice.ts";

export interface MfePageProps {
  /** true when single-spa mounted it inside the shell (the shell's <main> gives the padding). */
  isInShell?: boolean;
  children?: ReactNode;
}

/** No menu in the MFEs: [] (not null, which would mean "menu is loading"). */
const NO_MENU: never[] = [];

const RUN_ONCE: never[] = [];

/** Alone there is no shell header: HeadLayout sticks at the very top, as in an AsideLayout. */
function markNoHeader(): void {
  isAsideLayoutSignal.value = true;
}

export function MfePage(props: MfePageProps) {
  // In the shell: follow its layout (aside = no header). Alone: no header at all.
  const applyLayout = props.isInShell ? startMfeLayoutChoiceSync : markNoHeader;
  useLayoutEffect(applyLayout, RUN_ONCE);
  const pageClassName = props.isInShell ? "flex flex-col gap-4" : "flex min-h-screen flex-col gap-4 bg-base-200 p-4 lg:p-6";
  return (
    <SharedWebUiProvider config={config} nav={NO_MENU}>
      <div className={pageClassName}>{props.children}</div>
    </SharedWebUiProvider>
  );
}
