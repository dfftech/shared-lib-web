// Example app (its own package). Uses the library source directly through an alias,
// so no build or publish is needed to try changes.
//   npm install            (in example/)
//   npm run dev            -> http://localhost:5173
//   npm run build          -> example/dist

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { fakeApi } from "./fake-api.ts";

const exampleRootUrl = new URL(".", import.meta.url);
const exampleRoot = fileURLToPath(exampleRootUrl);
const packageEntryUrl = new URL("../src/index.ts", import.meta.url);
const packageEntry = fileURLToPath(packageEntryUrl);
const markdownEntryUrl = new URL("../src/markdown.ts", import.meta.url);
const markdownEntry = fileURLToPath(markdownEntryUrl);
const layoutEntryUrl = new URL("../src/layout.ts", import.meta.url);
const layoutEntry = fileURLToPath(layoutEntryUrl);

const reactPlugin = react();
const tailwindPlugin = tailwindcss();
// The fake backend (fake-api/*.json) for the sor URLs — dev server and preview only.
const fakeApiPlugin = fakeApi();

const aliasOptions = [
  { find: /^shared-lib-web\/markdown$/, replacement: markdownEntry },
  { find: /^shared-lib-web\/layout$/, replacement: layoutEntry },
  { find: /^shared-lib-web$/, replacement: packageEntry },
];

// dff-util depends on packages that expect Node's "global" object.
const defineOptions = {
  global: "globalThis",
};

// The library source lives outside this folder; make it use this app's single copy of these packages.
const dedupePackages = ["react", "react-dom", "@preact/signals-react", "react-hook-form", "lucide-react", "dff-util", "@uiw/react-md-editor"];

export default defineConfig({
  root: exampleRoot,
  define: defineOptions,
  plugins: [fakeApiPlugin, reactPlugin, tailwindPlugin],
  resolve: { alias: aliasOptions, dedupe: dedupePackages },
});
