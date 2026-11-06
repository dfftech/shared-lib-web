// test-loader-hook.mjs
// Node module hooks used only by the tests (registered in test-setup.mjs):
//   - a CSS import becomes an empty module (Node can not load .css)
//   - relative imports without extension inside packages (for example "./Editor.factory" in
//     @uiw/react-md-editor) are retried with ".js" and "/index.js", like a bundler would do.

const RETRY_SUFFIXES = [".js", "/index.js"];
const RETRY_ERROR_CODES = ["ERR_MODULE_NOT_FOUND", "ERR_UNSUPPORTED_DIR_IMPORT"];

/** Tries the next suffix; returns null when none of them exists. */
async function resolveWithSuffixes(specifier, context, nextResolve) {
  for (const suffix of RETRY_SUFFIXES) {
    try {
      const resolved = await nextResolve(`${specifier}${suffix}`, context);
      return resolved;
    } catch {
      // Try the next suffix.
    }
  }
  return null;
}

/** Normal resolution first; extension retry only for relative imports that failed. */
export async function resolve(specifier, context, nextResolve) {
  try {
    const resolved = await nextResolve(specifier, context);
    return resolved;
  } catch (error) {
    const isRelative = specifier.startsWith(".");
    const isRetryable = RETRY_ERROR_CODES.includes(error.code);
    if (!isRelative || !isRetryable) {
      throw error;
    }
    const retried = await resolveWithSuffixes(specifier, context, nextResolve);
    if (!retried) {
      throw error;
    }
    return retried;
  }
}

/** Returns an empty module for .css files and the normal result for everything else. */
export async function load(url, context, nextLoad) {
  if (url.endsWith(".css")) {
    return { format: "module", source: "", shortCircuit: true };
  }
  return nextLoad(url, context);
}
