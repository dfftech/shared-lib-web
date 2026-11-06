// type.mdv.tsx
// TypeMdv: markdown VIEWER. Shows markdown text as formatted content. Follows light/dark themes.
// Import from "shared-lib-web/markdown".
//
//   <TypeMdv text={post.content} />
//   <TypeMdv textByLanguage={post.contentLang} text={post.content} />   // picks the current language

import MDEditor from "@uiw/react-md-editor";
import { useUi } from "../context/use-ui.ts";
import { joinClassNames } from "./class-names.ts";
import { trans, type TranslationRecord } from "../utils/lang-util.ts";
import { MARKDOWN_SURFACE_STYLE, readMarkdownColorMode } from "./markdown-color-mode.ts";

export interface TypeMdvProps {
  /** Markdown text (also the fallback when textByLanguage has no text for the current language). */
  text?: string;
  /** Markdown per language: { en: "...", fr: "..." }. */
  textByLanguage?: TranslationRecord;
  className?: string;
}

export function TypeMdv(props: TypeMdvProps) {
  const { text = "", textByLanguage, className } = props;
  useUi();
  const colorMode = readMarkdownColorMode();
  const source = trans(textByLanguage, text);
  const classList = ["rounded-box", className];
  const wrapperClassName = joinClassNames(classList);

  return (
    <div data-color-mode={colorMode} className={wrapperClassName}>
      <MDEditor.Markdown source={source} style={MARKDOWN_SURFACE_STYLE} />
    </div>
  );
}
