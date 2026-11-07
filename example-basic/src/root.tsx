// root.tsx
// Basic example: the menu is a signal in the config (backend/backend-signals.ts); backend.service.ts fills it after
// sign in. No languages list (no language switcher) and no branches (x-branch-id is "").
import { SharedWebUiProvider } from "shared-lib-web";
import { useEffect } from "react";
import { App } from "./app.tsx";
import { startBackendData } from "./backend/backend.service.ts";
import { config } from "./config.ts";

const RUN_ONCE: never[] = [];

export function Root() {
  useEffect(startBackendData, RUN_ONCE);
  return (
    <SharedWebUiProvider type="spa" config={config}>
      <App />
    </SharedWebUiProvider>
  );
}
