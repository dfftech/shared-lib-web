// lucide-icon.ts
// Makes icon names from the backend safe for TypeIcon.
//
//   resolveLucideIcon("user-round-key")  -> "UserRoundKey"
//   resolveLucideIcon("Users")           -> "Users"
//   resolveLucideIcon("not-an-icon")     -> "Circle" (fallback, so an icon slot is never empty)

import * as LucideIcons from "lucide-react";
import { ConstValue } from "dff-util";
import type { IconName } from "../types/type.icon.ts";

/** Icon used when a name is empty or not a lucide icon. */
export const FALLBACK_ICON = "Circle";

const WORD_SEPARATOR_PATTERN = /[-_\s]+/;

const lucideIconNames = LucideIcons as unknown as Record<string, unknown>;

/** "sliders-vertical" / "sliders_vertical" / "sliders vertical" -> "SlidersVertical". */
export function toLucideName(iconName: string): string {
  const words = iconName.split(WORD_SEPARATOR_PATTERN);
  let pascalName = ConstValue.EMPTY;
  for (const word of words) {
    if (word.length === 0) {
      continue;
    }
    const firstLetter = word.charAt(0);
    const upperFirstLetter = firstLetter.toUpperCase();
    const restOfWord = word.slice(1);
    pascalName += `${upperFirstLetter}${restOfWord}`;
  }
  return pascalName;
}

/** true when lucide-react exports an icon with this name. */
export function isLucideIcon(iconName: string): boolean {
  return iconName in lucideIconNames;
}

/** Returns a valid lucide icon name for any value (exact, converted, or the fallback). */
export function resolveLucideIcon(iconName: string | undefined): IconName {
  if (!iconName) {
    return FALLBACK_ICON;
  }
  const isExactName = isLucideIcon(iconName);
  if (isExactName) {
    return iconName;
  }
  const convertedName = toLucideName(iconName);
  const isConvertedName = isLucideIcon(convertedName);
  if (isConvertedName) {
    return convertedName;
  }
  return FALLBACK_ICON;
}
