// content-util.ts
// Reads the content out of a content-load reply, for example sor /content-load?query=locales.en-US:
//
//   readContent(reply, "locales.en-US")
//     { "data": { "locales": { "en-US": {...} } } }  -> {...}
//     { "data": {...} }                              -> {...}
//     {...}                                          -> {...}
//
// "data" is taken off first; then each part of the query ("locales", "en-US") is followed while the object has it.
// So the reply may be the content itself or wrapped in the query path — both give the same result.

/** Separator of the query parts: "locales.en-US" -> ["locales", "en-US"]. */
const QUERY_SEPARATOR = ".";

/** true for a plain object (not null, not a list). */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  const isObject = typeof value === "object" && value !== null;
  return isObject && !Array.isArray(value);
}

/** The reply without its "data" wrapper (when it has one). */
function unwrapData(reply: unknown): unknown {
  if (!isPlainObject(reply)) {
    return reply;
  }
  const hasData = "data" in reply;
  return hasData ? reply.data : reply;
}

/** Follows one query part when the value has it; otherwise the value stays. */
function followQueryPart(value: unknown, part: string): unknown {
  if (isPlainObject(value) && part in value) {
    return value[part];
  }
  return value;
}

/**
 * The content of a content-load reply for a query ("theme", "locales", "locales.en-US"):
 * takes off "data", then follows the query parts the reply has.
 */
export function readContent(reply: unknown, query: string): unknown {
  let content = unwrapData(reply);
  const parts = query.split(QUERY_SEPARATOR);
  for (const part of parts) {
    content = followQueryPart(content, part);
  }
  return content;
}
