// article-layout.tsx
// Page header area: title, filters and actions at the top of a page.

import type { ReactNode } from "react";
import { joinClassNames } from "../types/class-names.ts";

export interface SectionLayoutProps {
  children?: ReactNode;
  className?: string;
}

export function ArticleLayout(props: SectionLayoutProps) {
  const classList = ["rounded-box bg-base-100 p-4 shadow-sm", props.className];
  const className = joinClassNames(classList);
  return <article className={className}>{props.children}</article>;
}
