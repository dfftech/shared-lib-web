// main.tsx — the "auth" MFE entry: exports the single-spa lifecycles (bootstrap / mount / unmount).
// The shell loads it from env.mfe.js: the dev server (npm run dev: http://localhost:PORT/src/main.tsx)
// or the build (npm run serve: auth.js).
import { createMfeLifecycles } from "./mfe-lifecycles.ts";
import { AuthMfe } from "./app-auth.tsx";
import "./index.css";

/** Build: auth.css sits next to auth.js. Dev server: Vite adds the CSS itself ("" = no <link>). */
const moduleUrl = import.meta.url;
const cssLocation = new URL("auth.css", moduleUrl);
const cssUrl = import.meta.env.DEV ? "" : cssLocation.href;

const lifecycles = createMfeLifecycles(AuthMfe, cssUrl);

export const bootstrap = lifecycles.bootstrap;
export const mount = lifecycles.mount;
export const unmount = lifecycles.unmount;
