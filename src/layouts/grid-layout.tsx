// grid-layout.tsx
// Container for a table or grid. Scrolls sideways on small screens.

import { joinClassNames } from "../types/class-names.ts";
import type { SectionLayoutProps } from "./article-layout.tsx";

export function GridLayout(props: SectionLayoutProps) {
  const classList = ["overflow-x-auto rounded-box bg-base-100 shadow-sm", props.className];
  const className = joinClassNames(classList);
  return <section className={className}>{props.children}</section>;
}
