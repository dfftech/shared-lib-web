// root.tsx
// Basic example: the provider gets only config and nav.
//   config = config.ts (one language: defaultLanguage "en-US" + loadLocale, no language list)
//   nav    = menu from the backend (null while loading, later the reply)
// No lang input (no language switcher) and no branch input (no store switcher, x-branch-id is "").
import { useSignals } from "@preact/signals-react/runtime";
import { SharedWebUiProvider } from "shared-lib-web";
import { App } from "./app.tsx";
import { config } from "./config.ts";
import { navSignal } from "./nav/nav.service.ts";

export function Root() {
  useSignals();
  const nav = navSignal.value;
  return (
    <SharedWebUiProvider config={config} nav={nav}>
      <App />
    </SharedWebUiProvider>
  );
}
