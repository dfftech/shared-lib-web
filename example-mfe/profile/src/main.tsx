// main.tsx — the "profile" MFE entry: exports the single-spa lifecycles (bootstrap / mount / unmount).
// The shell loads it from env.mfe.js: the dev server (npm run dev: http://localhost:PORT/src/main.tsx)
// or the build (npm run serve: profile.js).
import { createMfeLifecycles } from "./mfe-lifecycles.ts";
import { ProfileMfe } from "./app-profile.tsx";
import "./index.css";

/** Build: profile.css sits next to profile.js. Dev server: Vite adds the CSS itself ("" = no <link>). */
const moduleUrl = import.meta.url;
const cssLocation = new URL("profile.css", moduleUrl);
const cssUrl = import.meta.env.DEV ? "" : cssLocation.href;

const lifecycles = createMfeLifecycles(ProfileMfe, cssUrl);

export const bootstrap = lifecycles.bootstrap;
export const mount = lifecycles.mount;
export const unmount = lifecycles.unmount;
