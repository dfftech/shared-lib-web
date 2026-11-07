// backend-data.tsx — test helper: pushes backend replies into the library the way the config loaders do
// (null = still loading, a reply = show it), so tests can change them with rerender().
import { useLayoutEffect } from "react";
import type { BranchSource, LangSource, MenuSource } from "../src/index.ts";
import { registerBranches } from "../src/state/branch-service.ts";
import { registerLanguages } from "../src/state/language-service.ts";
import { registerMenu } from "../src/state/menu-service.ts";

export interface BackendDataProps {
  nav?: MenuSource | null;
  lang?: LangSource | null;
  branch?: BranchSource | null;
}

function applyBackendData(
  nav: MenuSource | null | undefined,
  lang: LangSource | null | undefined,
  branch: BranchSource | null | undefined,
): void {
  registerMenu(nav);
  registerLanguages(lang);
  registerBranches(branch);
}

export function BackendData(props: BackendDataProps) {
  const applyData = applyBackendData.bind(null, props.nav, props.lang, props.branch);
  const inputs = [props.nav, props.lang, props.branch];
  useLayoutEffect(applyData, inputs);
  return null;
}
