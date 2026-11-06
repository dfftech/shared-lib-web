// float-layout.tsx
// Floating action buttons fixed to the bottom corner (bottom-left in RTL).

import { joinClassNames } from "../types/class-names.ts";
import type { SectionLayoutProps } from "./article-layout.tsx";

export function FloatLayout(props: SectionLayoutProps) {
  const classList = ["fixed bottom-6 end-6 z-20 flex gap-2", props.className];
  const className = joinClassNames(classList);
  return <div className={className}>{props.children}</div>;
}
