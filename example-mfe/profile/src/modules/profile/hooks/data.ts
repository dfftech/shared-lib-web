// Profile default values (the example profile; a real app loads it with a call from service-http.ts).
import type { ProfileType } from "./types.ts";

export const profileInitValues: ProfileType = {
  name: "Asha Rao",
  email: "asha.rao@org.com",
  phone: "+91 98765 43210",
  role: "editor",
  location: "Hyderabad",
  about: "Plans the store roll-out and keeps the product catalogue up to date.",
};

export function getDefaultProfile(): ProfileType {
  return { ...profileInitValues };
}
