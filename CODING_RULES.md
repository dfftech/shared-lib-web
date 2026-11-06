# Coding rules for shared-lib-web

These rules keep the code easy to read for **people and AI tools**.
`npm run check:style` checks rules 1–3 and 10 (file names) and fails the build when one is broken.

## 1. No nested functions

Write every function at the top level of the file. No arrow function inside a component, hook or other function.

```tsx
// ❌ Bad
export function UserPage() {
  useEffect(() => { applyScreenAction(); }, []);
  return <button onClick={() => editModeUpdate(undefined)}>Close</button>;
}

// ✅ Good
const RUN_ONCE: never[] = [];

export function closeUserPopup(): void {
  void editModeUpdate(undefined);
}

export function UserPage() {
  useEffect(applyScreenAction, RUN_ONCE);
  return <button onClick={closeUserPopup}>Close</button>;
}
```

| Need | Pattern |
| --- | --- |
| Value inside a click handler | Put it in `data-*` and read `event.currentTarget.dataset` (`TypeButton dataValue`, `TypeTable` + `readRowKey(event)`) |
| `useEffect` | Pass a top-level function: `useEffect(loadUserListOnMount, RUN_ONCE)` |
| `computed` / `effect` | Pass a top-level function: `computed(readIsLoggedIn)` |
| `useMemo(() => ({...}))` props | Top-level builder: `const nameProps = buildNameProps(control, t);` |
| `new Promise(resolve => ...)` | Top-level executor: `new Promise<void>(waitForFakeNetwork)` |
| `form.handleSubmit(...)` | Top-level submit handler: `form.handleSubmit(handleUserSave)` |

## 2. No call inside a call

```ts
// ❌ Bad
abcd(xyz());
editModeUpdate(String(AppStorage.Get(SCREEN_ACTION)));

// ✅ Good
const mnt = xyz();
abcd(mnt);

const storedAction = AppStorage.Get(SCREEN_ACTION);
editModeUpdate(storedAction);
```

## 3. No chained calls

```ts
// ❌ Bad
const code = readCode().toLowerCase();

// ✅ Good
const rawCode = readCode();
const code = rawCode.toLowerCase();
```

## 4. Lists with `for ... of`

Build element lists with `for ... of` and `push`, not `.map()` with an inline arrow.

## 5. `.ts` logic, `.tsx` view

In app modules, logic lives in `{name}.ts` (hooks, props builders, handlers) and markup in `{name}.tsx`
with the same base name. Import with the extension: `import { useUserForm } from "./user.form.ts";`.

## 5b. Import paths with extensions

Relative imports use the real file name: `import { TypeIcon } from "./type.icon.ts";`.
`tsc` rewrites them to `.js` when it builds `dist/`, so the library works in every bundler.

## 6. Use dff-util first

Before writing a constant, regex, message key, helper or type, use the `dff-util` export:
`ConstValue`, `ConstKeys`, `RegExp`, `Countries`, `AppUUID4`, `TimeAgo`, `OptionType`, `LangDirType` ...

## 7. Full DaisyUI class names

Never build a class like `"btn-" + action`. Use lookup tables with full names (`src/types/class-names.ts`).

## 8. Named exports only

`export function X` and `import { X }`. No default exports (config files of tools excepted).

## 9. Clear names and comments

Every file starts with a short comment saying what it does. Every exported function has a `/** ... */` line.
Booleans start with `is`, `has`, `can` or `show`.

## 10. File names: lowercase with "-"

Every file name is lowercase words joined with `-`. A `.` separates a role suffix.
Folders follow the same rule.

| Kind | Example |
| --- | --- |
| Component / layout | `app-layout.tsx`, `language-switcher.tsx`, `ui-provider.tsx` |
| Type* control | `type.icon.ts`, `type.input.tsx`, `type.text-area.tsx` |
| Module files | `user.page.tsx`, `user.form.ts`, `user.form.tsx`, `service-http.ts` |
| Test | `ui-provider.test.tsx` |
| Locale (language code, the one exception) | `en-US.json`, `ar-SA.json` |

Not allowed: `AppLayout.tsx`, `uiProvider.ts`, `user_form.ts`. The component INSIDE the file keeps its
PascalCase name (`export function AppLayout`).

## 11. Tests

Tests live in `tests/` and run on Node's built-in test runner (no Vite / Vitest). Import `describe`, `it`, `afterEach`
from `node:test` and `expect` from `./expect.ts` (a small wrapper around `node:assert`).
Use named top-level test functions: `it("switches theme", testSwitchTheme)`.
`expect(...).toBe(...)` chains are allowed in tests only.
