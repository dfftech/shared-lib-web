// main.tsx — the "settings" MFE entry: exports the single-spa lifecycles (bootstrap / mount / unmount).
// The shell loads it from env.mfe.js: the dev server (npm run dev: http://localhost:PORT/src/main.tsx)
// or the build (npm run serve: settings.js).
import { createMfeLifecycles } from "../../shared/mfe-lifecycles.ts";
import { SettingsMfe } from "./settings.page.tsx";
import "./index.css";

/** Build: settings.css sits next to settings.js. Dev server: Vite adds the CSS itself ("" = no <link>). */
const moduleUrl = import.meta.url;
const cssLocation = new URL("settings.css", moduleUrl);
const cssUrl = import.meta.env.DEV ? "" : cssLocation.href;

const lifecycles = createMfeLifecycles(SettingsMfe, cssUrl);

export const bootstrap = lifecycles.bootstrap;
export const mount = lifecycles.mount;
export const unmount = lifecycles.unmount;
