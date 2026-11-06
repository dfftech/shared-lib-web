// use-query-param.ts
// Hooks that re-render the component when a query parameter changes.
//
//   const page = useCurrentPage();          // "/profiles" from ?page=profiles (or config.homePath)
//   const userId = useQueryParam("userId"); // "42" from ?userId=42, or undefined
//
// Do not also call useSignals() or useUi() in the same component (both already subscribe).

import { useSignals } from "@preact/signals-react/runtime";
import { currentPageSignal, queryParamsSignal } from "../state/signals.ts";

/** The current page (?page, else config.homePath). Re-renders when it changes. */
export function useCurrentPage(): string {
  useSignals();
  return currentPageSignal.value;
}

/** One query parameter, or undefined. Re-renders when it changes. */
export function useQueryParam(key: string): string | undefined {
  useSignals();
  const params = queryParamsSignal.value;
  return params[key];
}
