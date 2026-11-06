// User default values and sample data.
import type { UserType } from "./types.ts";

export const userInitValues: UserType = {
  id: "",
  name: "",
  email: "",
  phone: "",
  role: "",
  country: "",
  active: true,
  notes: "",
  updatedAt: "",
};

export function getDefaultUser(): UserType {
  return { ...userInitValues };
}

/** Sample rows used by the fake service-http.ts. */
export const sampleUsers: UserType[] = [
  { id: "u1", name: "Asha Rao", email: "asha@example.com", phone: "9876543210", role: "admin", country: "IN", active: true, notes: "", updatedAt: "2026-11-01T10:00:00.000Z" },
  { id: "u2", name: "Lucas Martin", email: "lucas@example.com", phone: "33612345678", role: "editor", country: "FR", active: true, notes: "", updatedAt: "2026-10-28T09:30:00.000Z" },
  { id: "u3", name: "Lena Becker", email: "lena@example.com", phone: "4915112345678", role: "viewer", country: "DE", active: false, notes: "", updatedAt: "2026-10-20T14:15:00.000Z" },
  { id: "u4", name: "Omar Haddad", email: "omar@example.com", phone: "966501234567", role: "editor", country: "SA", active: true, notes: "", updatedAt: "2026-11-03T08:45:00.000Z" },
];
