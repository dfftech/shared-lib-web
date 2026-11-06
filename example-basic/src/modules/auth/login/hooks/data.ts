// Login default values.
import type { LoginType } from "./types.ts";

export const loginInitValues: LoginType = { email: "", password: "", remember: true };

export function getDefaultLogin(): LoginType {
  return { ...loginInitValues };
}
