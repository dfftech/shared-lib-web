// fix-declaration-imports.mjs
// tsc writes the source import paths ("./x.ts", "./y.tsx") unchanged into the .d.ts files.
// This script changes them to "./x.js" so every TypeScript setup of an app can read the types.

import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const RELATIVE_TS_IMPORT = /(from\s+["']|import\(\s*["'])(\.{1,2}\/[^"']+)\.tsx?(["'])/g;

function collectDeclarationFiles(folderPath, foundFiles) {
  const entryNames = readdirSync(folderPath);
  for (const entryName of entryNames) {
    const entryPath = join(folderPath, entryName);
    const entryStats = statSync(entryPath);
    if (entryStats.isDirectory()) {
      collectDeclarationFiles(entryPath, foundFiles);
      continue;
    }
    if (entryPath.endsWith(".d.ts")) {
      foundFiles.push(entryPath);
    }
  }
  return foundFiles;
}

function fixFile(filePath) {
  const fileText = readFileSync(filePath, "utf8");
  const fixedText = fileText.replace(RELATIVE_TS_IMPORT, "$1$2.js$3");
  if (fixedText !== fileText) {
    writeFileSync(filePath, fixedText);
  }
}

function main() {
  const declarationFiles = collectDeclarationFiles("dist", []);
  for (const filePath of declarationFiles) {
    fixFile(filePath);
  }
  console.log(`Declaration imports fixed (${declarationFiles.length} files).`);
}

main();
