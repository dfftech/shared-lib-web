// User module types.
export type UserRole = "admin" | "editor" | "viewer";

export interface UserType {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole | "";
  country: string;
  active: boolean;
  notes: string;
  updatedAt: string;
}

export type UserEditMode = "edit" | "add";
