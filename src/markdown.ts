// shared-lib-web/markdown
// Markdown Type* controls. A separate entry so apps without markdown do not need @uiw/react-md-editor.
//
//   import { TypeMdx, TypeMdv, TypeLangMd } from "shared-lib-web/markdown";
//
//   TypeMdx     markdown editor (react-hook-form)
//   TypeMdv     markdown viewer (text or text per language)
//   TypeLangMd  markdown editor per language (react-hook-form), with translate buttons

export { TypeMdx, type TypeMdxProps } from "./types/type.mdx.tsx";
export { TypeMdv, type TypeMdvProps } from "./types/type.mdv.tsx";
export { TypeLangMd, type TypeLangMdProps } from "./types/type.lang-md.tsx";
