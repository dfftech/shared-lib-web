// root.tsx
// The provider. Languages, branches and the menu are signals in the config (app-init/app-init-signals.ts);
// app-init.service.ts fills them: languages on start, branches and menu after sign in.
import { SharedWebUiProvider } from "shared-lib-web";
import { useEffect } from "react";
import { App } from "./app.tsx";
import { startAppInit } from "./app-init/app-init.service.ts";
import { config } from "./config.ts";
import { restoreLayoutChoice } from "./layout/layout-choice.ts";

const RUN_ONCE: never[] = [];

export function Root() {
  useEffect(restoreLayoutChoice, RUN_ONCE);
  useEffect(startAppInit, RUN_ONCE);
  return (
    <SharedWebUiProvider type="spa" config={config}>
      <App />
    </SharedWebUiProvider>
  );
}
