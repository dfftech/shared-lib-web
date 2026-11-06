// content-layout.tsx
// Main content card of a page, for example a form or a details view.

import { joinClassNames } from "../types/class-names.ts";
import type { SectionLayoutProps } from "./article-layout.tsx";

export function ContentLayout(props: SectionLayoutProps) {
  const classList = ["rounded-box bg-base-100 p-4 shadow-sm", props.className];
  const className = joinClassNames(classList);
  return <section className={className}>{props.children}</section>;
}
