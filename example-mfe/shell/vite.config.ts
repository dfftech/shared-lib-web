// vite.config.ts — the shell: its own Vite project (a normal app, not a library build).
//   npm run dev   -> http://localhost:9000   (start the MFEs with "npm run serve" in their folders first)
// It uses the library source (../../src) through an alias.

import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const projectRootUrl = new URL(".", import.meta.url);
const projectRoot = fileURLToPath(projectRootUrl);
const repoRootUrl = new URL("../..", import.meta.url);
const repoRoot = fileURLToPath(repoRootUrl);
const libraryEntryUrl = new URL("../../src/index.ts", import.meta.url);
const libraryEntry = fileURLToPath(libraryEntryUrl);
const layoutEntryUrl = new URL("../../src/layout.ts", import.meta.url);
const layoutEntry = fileURLToPath(layoutEntryUrl);

const reactPlugin = react();
const tailwindPlugin = tailwindcss();

const aliasOptions = [
  { find: /^shared-lib-web\/layout$/, replacement: layoutEntry },
  { find: /^shared-lib-web$/, replacement: libraryEntry },
];

// The library source lives outside this folder: resolve these packages from THIS project.
const dedupePackages = ["react", "react-dom", "@preact/signals-react", "react-hook-form", "lucide-react", "dff-util", "single-spa"];

export default defineConfig({
  root: projectRoot,
  define: { global: "globalThis" },
  plugins: [reactPlugin, tailwindPlugin],
  resolve: { alias: aliasOptions, dedupe: dedupePackages },
  server: { fs: { allow: [repoRoot] } },
});
