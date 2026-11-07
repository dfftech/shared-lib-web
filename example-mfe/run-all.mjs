// run-all.mjs — runs an npm script in every folder of the microfrontend example (each is its own Vite project).
//   node run-all.mjs install   npm install in shell, settings, forms, profile
//   node run-all.mjs build     npm run build in each
//   node run-all.mjs start     everything with npm run dev: shell 9000, MFEs 5186-5188 (env.mfe.js points there)
//   node run-all.mjs serve     MFEs built + previewed on 5176-5178 (switch the urls in env.mfe.js), shell dev 9000
// Stop "start" with Ctrl+C.

import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const FOLDERS = ["shell", "settings", "forms", "profile"];
const MFE_FOLDERS = ["settings", "forms", "profile"];
const NPM = process.platform === "win32" ? "npm.cmd" : "npm";

function folderPath(folder) {
  const folderUrl = new URL(`./${folder}/`, import.meta.url);
  return fileURLToPath(folderUrl);
}

/** Runs npm with args in a folder; resolves with its exit code. */
function runNpm(folder, args) {
  const options = { cwd: folderPath(folder), stdio: "inherit", shell: process.platform === "win32" };
  const child = spawn(NPM, args, options);
  return new Promise(waitForExit.bind(null, child));
}

function waitForExit(child, resolve) {
  child.on("exit", resolve);
}

/** One after the other (install / build). */
async function runInEveryFolder(args) {
  for (const folder of FOLDERS) {
    console.log(`\n=== ${folder}: npm ${args.join(" ")}`);
    const exitCode = await runNpm(folder, args);
    if (exitCode !== 0) {
      process.exit(exitCode ?? 1);
    }
  }
}

/** All at once: the MFEs ("dev" = dev servers 5186-5188, "serve" = builds on 5176-5178) and the shell. */
function startAll(mfeScript) {
  for (const folder of MFE_FOLDERS) {
    void runNpm(folder, ["run", mfeScript]);
  }
  void runNpm("shell", ["run", "dev"]);
  console.log("\nShell: http://localhost:9000\n");
}

const command = process.argv[2];
if (command === "install") {
  await runInEveryFolder(["install"]);
} else if (command === "build") {
  await runInEveryFolder(["run", "build"]);
} else if (command === "start") {
  startAll("dev");
} else if (command === "serve") {
  startAll("serve");
} else {
  console.log("Use: node run-all.mjs install | build | start | serve");
}
