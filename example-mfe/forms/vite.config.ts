// vite.config.ts — the "forms" MFE: its own Vite project.
//   npm run dev     -> http://localhost:5187   the MFE alone (index.html + src/dev.tsx), with hot reload
//   npm run serve   -> http://localhost:5177/forms.js   built as ONE ES module + forms.css for the single-spa root
// It uses the library source (../../src) through an alias, and the shared MFE files in ../shared.

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
const mfeEntryUrl = new URL("./src/main.tsx", import.meta.url);
const mfeEntry = fileURLToPath(mfeEntryUrl);

const reactPlugin = react();
const tailwindPlugin = tailwindcss();

const aliasOptions = [
  { find: /^shared-lib-web\/layout$/, replacement: layoutEntry },
  { find: /^shared-lib-web$/, replacement: libraryEntry },
];

// The library source and ../shared live outside this folder: resolve these packages from THIS project.
const dedupePackages = ["react", "react-dom", "@preact/signals-react", "react-hook-form", "lucide-react", "dff-util", "single-spa", "single-spa-react"];

// Library build: one ES module (forms.js) + its CSS (forms.css). React and shared-lib-web are bundled in,
// so the MFE runs on its own; the root only needs its URL.
const libraryOptions = { entry: mfeEntry, formats: ["es" as const], fileName: "forms", cssFileName: "forms" };

// "vite build" (npm run build / serve) = production React; "vite" (npm run dev) = development React.
const isBuild = process.argv.includes("build");
const nodeEnvText = JSON.stringify(isBuild ? "production" : "development");

export default defineConfig({
  root: projectRoot,
  // dff-util expects Node's "global"; a library build does not replace process.env.NODE_ENV by itself.
  define: { global: "globalThis", "process.env.NODE_ENV": nodeEnvText },
  plugins: [reactPlugin, tailwindPlugin],
  resolve: { alias: aliasOptions, dedupe: dedupePackages },
  // The shell (another port) imports this dev server's modules; their asset URLs must point back here.
  server: { fs: { allow: [repoRoot] }, cors: true, origin: "http://localhost:5187" },
  // The root (another port) loads forms.js from here.
  preview: { cors: true },
  build: { lib: libraryOptions, outDir: "dist", emptyOutDir: true },
});
