// root.tsx
// The provider with its three inputs:
//   config = config.ts (static shell setup)
//   nav    = menu from the backend (null, later the reply)
//   lang   = languages from the backend (null, later the reply)
//   branch = branches from the backend after login (null = no switcher; rows bring isDefault and disabled)
import { useSignals } from "@preact/signals-react/runtime";
import { SharedWebUiProvider } from "shared-lib-web";
import { useEffect } from "react";
import { App } from "./app.tsx";
import { branchSignal } from "./branch/branch.service.ts";
import { config } from "./config.ts";
import { langSignal, loadLanguagesOnMount } from "./lang/lang.service.ts";
import { restoreLayoutChoice } from "./layout/layout-choice.ts";
import { navSignal } from "./nav/nav.service.ts";

const RUN_ONCE: never[] = [];

export function Root() {
  useSignals();
  useEffect(loadLanguagesOnMount, RUN_ONCE);
  useEffect(restoreLayoutChoice, RUN_ONCE);
  const nav = navSignal.value;
  const lang = langSignal.value;
  const branch = branchSignal.value;
  return (
    <SharedWebUiProvider config={config} nav={nav} lang={lang} branch={branch}>
      <App />
    </SharedWebUiProvider>
  );
}
