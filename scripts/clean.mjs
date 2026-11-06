// Removes a build folder before a fresh build. Default "dist".
//   node scripts/clean.mjs            -> removes dist
//   node scripts/clean.mjs build-test -> removes build-test
import { rmSync } from "node:fs";

const folderArgument = process.argv[2];
const folder = folderArgument ?? "dist";
const removeOptions = { recursive: true, force: true };
rmSync(folder, removeOptions);
