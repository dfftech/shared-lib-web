// Login default values.
import type { LoginType } from "./types.ts";

export const loginInitValues: LoginType = { email: "", password: "" };

export function getDefaultLogin(): LoginType {
  return { ...loginInitValues };
}
