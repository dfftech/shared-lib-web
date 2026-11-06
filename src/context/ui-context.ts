// ui-context.ts
// The React context that carries the config. Live values (locale, theme ...) come from signals.

import { createContext } from "react";
import type { UiContextState } from "../interfaces/ui-context.ts";

export const UiContext = createContext<UiContextState | null>(null);

const contextStateCache = new WeakMap<object, UiContextState>();

/** Returns one stable context object per config, so consumers do not re-render needlessly. */
export function readContextState(config: UiContextState["config"]): UiContextState {
  const cachedState = contextStateCache.get(config);
  if (cachedState) {
    return cachedState;
  }
  const newState: UiContextState = { config: config };
  contextStateCache.set(config, newState);
  return newState;
}
