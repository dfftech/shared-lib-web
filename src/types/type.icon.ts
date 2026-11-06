// type.icon.ts
// The ONE icon component of shared-lib-web. Every icon (package and apps) uses it.
// Icons come from lucide-react and are chosen by name: https://lucide.dev/icons
//
//   <TypeIcon name="Users" />                                  -> plain icon
//   <TypeIcon name="Pencil" title="Edit" onPress={handleEdit} /> -> clickable icon button

import type { LucideIcon } from 'lucide-react';
import * as Icons from 'lucide-react';
import React from 'react';

export type IconName = keyof typeof Icons | string;

export type TypeIconProps = {
  name?: string;
  size?: number;
  className?: string;
  action?: 'primary' | 'secondary' | 'ghost' | 'accent' | 'error' | 'neutral';
  onClick?: (e?: React.MouseEvent) => void;
  onPress?: () => void;
  title?: string;
  disabled?: boolean;
};

export function TypeIcon({
  name,
  size = 18,
  className = '',
  onClick,
  onPress,
  title,
  disabled,
}: TypeIconProps) {
  const IconComponent = name ? (Icons as unknown as Record<string, LucideIcon>)[name] : undefined;
  const clickHandler = onClick || onPress;
  const content = IconComponent ? React.createElement(IconComponent, { size, className }) : null;
  if (clickHandler) {
    return React.createElement(
      'button',
      {
        type: 'button',
        title,
        disabled,
        onClick: disabled ? undefined : clickHandler,
        className: `${
          disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:opacity-80'
        } inline-flex items-center justify-center p-1 rounded-md transition-opacity ${className}`,
      },
      content
    );
  }
  return content;
}
