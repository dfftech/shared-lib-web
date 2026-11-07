// mfe-page.tsx
// What every MFE renders: the provider (type "mfe": theme, language, menu mode and layout choice from localStorage;
// no menu, no branch calls) and its page — NO AppLayout.
//   In the shell: the shell's layout <main> already has the padding, so the page is rendered as it is.
//   Alone (npm run dev): a page box with the same padding (p-4 lg:p-6), so HeadLayout looks the same.
//   HeadLayout sticks below the shell header (top-16) in the app layout, and at the very top (top-0) when there is
//   no header: in the aside layout (layoutChoiceSignal "aside", picked in the settings MFE), or when the MFE runs alone.

import { effect } from "@preact/signals-react";
import { SharedWebUiProvider, isAsideLayoutSignal, layoutChoiceSignal } from "shared-lib-web";
import { useEffect, useLayoutEffect, type ReactNode } from "react";
import { config, startConfigData } from "./config.ts";

export interface MfePageProps {
  /** true when single-spa mounted it inside the shell (the shell's <main> gives the padding). */
  isInShell?: boolean;
  children?: ReactNode;
}

const RUN_ONCE: never[] = [];

/** The shell layout without a header (aside) -> HeadLayout at the very top. */
function copyLayoutChoice(): void {
  isAsideLayoutSignal.value = layoutChoiceSignal.value === "aside";
}

/** In the shell: follow its layout choice (the library keeps layoutChoiceSignal in sync). Returns the cleanup. */
function followShellLayout(): () => void {
  return effect(copyLayoutChoice);
}

/** Alone there is no shell header: HeadLayout sticks at the very top, as in an AsideLayout. */
function markNoHeader(): void {
  isAsideLayoutSignal.value = true;
}

export function MfePage(props: MfePageProps) {
  const applyLayout = props.isInShell ? followShellLayout : markNoHeader;
  useLayoutEffect(applyLayout, RUN_ONCE);
  useEffect(startConfigData, RUN_ONCE);
  const pageClassName = props.isInShell ? "flex flex-col gap-4" : "flex min-h-screen flex-col gap-4 bg-base-200 p-4 lg:p-6";
  return (
    <SharedWebUiProvider type="mfe" config={config}>
      <div className={pageClassName}>{props.children}</div>
    </SharedWebUiProvider>
  );
}
