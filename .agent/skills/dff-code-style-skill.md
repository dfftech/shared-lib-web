---
name: dff-code-style
description: >
  Readability rules for every DesignForFeature TypeScript/React file: no nested
  functions, no function call passed into another call, no chained calls,
  for...of loops, named exports. Enforced by scripts/check-code-style.mjs.
---

# DFF code style — easy for people and AI to read

Run `npm run check:style` after every change. It must print `Code style OK`.

## Rule 1 — NO_NESTED_FUNCTION

Every function is declared at the top level of the file. No arrow functions inside components, hooks or functions.

| Instead of | Write |
| --- | --- |
| `useEffect(() => { load(); }, [])` | `const RUN_ONCE: never[] = [];` + `useEffect(loadOnMount, RUN_ONCE)` |
| `onClick={() => remove(id)}` | `data-value={id}` + top-level `handleRemoveClick(event)` reading `event.currentTarget.dataset.value` |
| `useMemo(() => ({ ...props }), [deps])` | top-level `buildXProps(control, t)` called during render |
| `computed(() => a.value > 0)` | `computed(readHasItems)` |
| `items.map((item) => <Row item={item} />)` | `for (const item of items) { const row = <Row ... />; rows.push(row); }` in a top-level `buildRows(items)` |
| `new Promise((resolve) => setTimeout(resolve, 300))` | top-level `waitForFakeNetwork(resolve)` + `new Promise<void>(waitForFakeNetwork)` |
| `.catch((error) => ...)` | `promise.catch(handleLoadError)` |

## Rule 2 — NO_CALL_INSIDE_CALL

```ts
// WRONG
abcd(xyz());
saveUser(await loadUser(id));

// RIGHT
const mnt = xyz();
abcd(mnt);
const user = await loadUser(id);
saveUser(user);
```

Calls inside object literals and JSX attributes are allowed (`{ label: t("x") }`, `label={t("x")}`),
but prefer a named const for anything non-trivial.

## Rule 3 — NO_CHAINED_CALL

```ts
// WRONG
const code = readCode().toLowerCase();
// RIGHT
const rawCode = readCode();
const code = rawCode.toLowerCase();
```

## Rule 4 — FILE_NAMING

File and folder names: lowercase words joined with `-`, `.` for a role suffix.
`app-layout.tsx`, `ui-provider.tsx`, `type.icon.ts`, `type.text-area.tsx`, `user.form.ts`, `service-http.ts`, `ui-provider.test.tsx`.
Never `AppLayout.tsx`, `uiProvider.ts`, `user_form.ts`. Exported components stay PascalCase inside the file.

## Also

- Named exports only (`export function X`); no default exports except tool config files.
- File header comment explaining the file; `/** ... */` on every exported function.
- Clear names: `languageCode`, `isLoading`, `userRows`; booleans start with `is` / `has` / `can` / `show`.
- Tests: Node's built-in runner (`node:test`) with `expect` from `tests/expect.ts`; named top-level test functions, `it("does x", testDoesX)`; `expect(...).toBe(...)` chains are allowed in tests only. No Vite / Vitest.
