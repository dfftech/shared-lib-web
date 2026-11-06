// class-names.ts
// Full DaisyUI class names for the Type* controls.
// Tailwind only keeps classes written out completely, so never build them like "btn-" + action.

export type ButtonAction = "primary" | "secondary" | "accent" | "neutral" | "info" | "success" | "warning" | "error" | "ghost" | "link";

export type ControlSize = "xs" | "sm" | "md" | "lg";

/** Joins class names with a space and skips empty values. */
export function joinClassNames(classNames: Array<string | false | null | undefined>): string {
  const usedClassNames: string[] = [];
  for (const className of classNames) {
    if (className) {
      usedClassNames.push(className);
    }
  }
  const joinedClassNames = usedClassNames.join(" ");
  return joinedClassNames;
}

export const BUTTON_ACTION_CLASSES: Record<ButtonAction, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  accent: "btn-accent",
  neutral: "btn-neutral",
  info: "btn-info",
  success: "btn-success",
  warning: "btn-warning",
  error: "btn-error",
  ghost: "btn-ghost",
  link: "btn-link",
};

export const BUTTON_SIZE_CLASSES: Record<ControlSize, string> = {
  xs: "btn-xs",
  sm: "btn-sm",
  md: "btn-md",
  lg: "btn-lg",
};

export const INPUT_SIZE_CLASSES: Record<ControlSize, string> = {
  xs: "input-xs",
  sm: "input-sm",
  md: "input-md",
  lg: "input-lg",
};

export const SELECT_SIZE_CLASSES: Record<ControlSize, string> = {
  xs: "select-xs",
  sm: "select-sm",
  md: "select-md",
  lg: "select-lg",
};
