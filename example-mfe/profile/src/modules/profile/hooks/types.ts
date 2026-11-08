// Profile types.
export interface ProfileType {
  name: string;
  email: string;
  phone: string;
  role: string;
  location: string;
  about: string;
}

/** One label + value row of the profile view. */
export interface ProfileRowType {
  label: string;
  value: string;
}
