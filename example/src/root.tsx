// root.tsx
// The provider. Languages, branches and the menu are signals in the config (backend/backend-signals.ts);
// backend.service.ts fills them: languages on start, branches and menu after sign in.
import { SharedWebUiProvider } from "shared-lib-web";
import { useEffect } from "react";
import { App } from "./app.tsx";
import { startBackendData } from "./backend/backend.service.ts";
import { config } from "./config.ts";
import { restoreLayoutChoice } from "./layout/layout-choice.ts";

const RUN_ONCE: never[] = [];

export function Root() {
  useEffect(restoreLayoutChoice, RUN_ONCE);
  useEffect(startBackendData, RUN_ONCE);
  return (
    <SharedWebUiProvider type="spa" config={config}>
      <App />
    </SharedWebUiProvider>
  );
}
