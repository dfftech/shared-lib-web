// main.tsx — the "forms" MFE entry: exports the single-spa lifecycles (bootstrap / mount / unmount).
// The shell loads it from env.mfe.js: the dev server (npm run dev: http://localhost:PORT/src/main.tsx)
// or the build (npm run serve: forms.js).
import { createMfeLifecycles } from "../../shared/mfe-lifecycles.ts";
import { FormsMfe } from "./forms.page.tsx";
import "./index.css";

/** Build: forms.css sits next to forms.js. Dev server: Vite adds the CSS itself ("" = no <link>). */
const moduleUrl = import.meta.url;
const cssLocation = new URL("forms.css", moduleUrl);
const cssUrl = import.meta.env.DEV ? "" : cssLocation.href;

const lifecycles = createMfeLifecycles(FormsMfe, cssUrl);

export const bootstrap = lifecycles.bootstrap;
export const mount = lifecycles.mount;
export const unmount = lifecycles.unmount;
