#!/usr/bin/env python3
# build-shell-script.py — turns example-mfe/shell into ONE stand-alone bash script (mfe-shell-web.sh).
#   python3 scripts/build-shell-script.py [out-file]      (default: dist-scripts/mfe-shell-web.sh)
# The generated script creates the shell as its own project:
#   - the files of example-mfe/shell (it has its own config, locales, theme and layout-choice: no shared folder)
#   - shared-lib-web from npm (no alias to the library source)
#   - text files as quoted heredocs, images (svg, png, jpg, gif, ico, webp) as base64
# Run it again after changing the shell, so the script stays the same as the example.

import base64
import pathlib
import re
import sys

REPO = pathlib.Path(__file__).resolve().parent.parent
MFE = REPO / "example-mfe"
SHELL = MFE / "shell"
OUT = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else REPO / "dist-scripts" / "mfe-shell-web.sh"

IMAGE_SUFFIXES = {".svg", ".png", ".jpg", ".jpeg", ".gif", ".ico", ".webp"}
SKIP_NAMES = {"node_modules", "dist", "package-lock.json", "package.json", "vite.config.ts", "tsconfig.json"}

# path in the new project -> source file
files: dict[str, pathlib.Path] = {}
for source in sorted(SHELL.rglob("*")):
    relative = source.relative_to(SHELL)
    if source.is_dir() or relative.parts[0] in SKIP_NAMES:
        continue
    files[str(relative)] = source


def fix_text(path: str, text: str) -> str:
    """Rewrites the monorepo paths so the project stands alone."""
    if path == "src/index.css":
        text = text.replace(
            '/* index.css — styles of the shell (AppLayout, home and settings pages).\n'
            '   In a real app replace the library @source line with:  @import "shared-lib-web/styles.css";  */',
            "/* index.css — styles of the shell (AppLayout, home and settings pages). */",
        )
        text = text.replace('@import "tailwindcss";', '@import "tailwindcss";\n@import "shared-lib-web/styles.css";', 1)
        text = re.sub(r'@source "\.\./\.\./\.\./src";\n', "", text)
    if path == "index.html":
        text = text.replace("<title>Org MFE shell</title>", "<title>__APP_NAME__</title>")
    return text


PACKAGE_JSON = """{
  "name": "__APP_NAME__",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "description": "MFE shell: AppLayout / AsideLayout (header, menu, user), Settings page, single-spa routing from public/env.mfe.js (login = the auth MFE).",
  "scripts": {
    "dev": "vite --port 9000 --strictPort",
    "build": "tsc -p tsconfig.json && vite build",
    "preview": "vite preview --port 9000 --strictPort",
    "typecheck": "tsc -p tsconfig.json"
  }
}
"""

VITE_CONFIG = """// vite.config.ts — the MFE shell (a normal app).
//   npm run dev   -> http://localhost:9000   (start the MFEs first; their urls are in public/env.mfe.js)
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  // dff-util expects Node's "global" object.
  define: { global: "globalThis" },
  plugins: [react(), tailwindcss()],
});
"""

TSCONFIG = """{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2024", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "types": ["vite/client"]
  },
  "include": ["src"]
}
"""

GITIGNORE = """node_modules/
dist/
*.tsbuildinfo
.env
.env.*
!.env.example
npm-debug.log*
.vite/
.DS_Store
Thumbs.db
.idea/
.vscode/
"""

README = """# __APP_NAME__

MFE shell built with [shared-lib-web](https://www.npmjs.com/package/shared-lib-web) and single-spa.

```bash
npm install
npm run dev      # http://localhost:9000
npm run build    # -> dist/
```

- `public/env.mfe.js` — the MFEs: `{ id, path, url, render }` (change per environment, no build needed)
- `src/config.ts` — shell config (app key, languages, themes, logo, layout, http, menu); texts, themes, languages, company details and menu from sor
- `src/shell.tsx` — provider, AppLayout / AsideLayout, home + `SHELL_PAGES`; MFEs mount in `<div id="mfe-body">`
- `src/settings.page.tsx` — the Settings page (a shell page)
- `src/mfe.ts` — single-spa registration; `src/session.ts` — sign out and the menu
- No login in the shell: signed out it shows the auth MFE (`env.mfe.js` entry with `isAuth: true`, run it on 5186); the menu comes from utils `/authorization/<persona>`
"""

generated: dict[str, str] = {}
for path, source in files.items():
    if source.suffix.lower() not in IMAGE_SUFFIXES:
        generated[path] = fix_text(path, source.read_text(encoding="utf-8"))
generated["package.json"] = PACKAGE_JSON
generated["vite.config.ts"] = VITE_CONFIG
generated["tsconfig.json"] = TSCONFIG
generated[".gitignore"] = GITIGNORE
generated["README.md"] = README

# Paths that leave the shell project (the library source, ../../../src): imports inside src/ (../../mfe.ts) are fine.
MONOREPO_PATH = re.compile(r"(\.\./){3,}|\.\./\.\./src\b")
leftover = [p for p, t in generated.items() if MONOREPO_PATH.search(t) and p.endswith((".ts", ".tsx", ".css"))]
if leftover:
    sys.exit(f"Monorepo paths left in: {leftover}")

lines: list[str] = []
add = lines.append
add("""#!/usr/bin/env bash
# mfe-shell-web.sh — creates the MFE shell project (React 19, Vite, Tailwind 4, DaisyUI 5, single-spa, shared-lib-web).
# Generated from shared-lib-web/example-mfe/shell by scripts/build-shell-script.py — do not edit by hand:
# change the example, then run  python3 scripts/build-shell-script.py <this file>  again.
#
# Usage:
#   sh mfe-shell-web.sh <path> <name>
#     path   parent folder (created when missing)
#     name   project / module name -> creates <path>/<name>
#
# Example: sh project/mfe-shell-web.sh /Volumes/work/poc web-shell-poc
# Then:    cd /Volumes/work/poc/web-shell-poc && npm run dev   -> http://localhost:9000
# Needs: node + npm (and git, optional).

# Started with "sh": run again with bash.
if [ -z "${BASH_VERSION:-}" ]; then
  exec bash "$0" "$@"
fi

set -euo pipefail

BASE_PATH="${1:-}"
APP_NAME="${2:-}"

if [ -z "$BASE_PATH" ] || [ -z "$APP_NAME" ]; then
  echo "Usage: sh mfe-shell-web.sh <path> <name>" >&2
  echo "  e.g. sh mfe-shell-web.sh /Volumes/work/poc web-shell-poc" >&2
  exit 1
fi
if ! echo "$APP_NAME" | grep -Eq '^[a-z0-9][a-z0-9._-]*$'; then
  echo "Name '$APP_NAME' must be lowercase (letters, digits, - . _), for example mfe-shell-web." >&2
  exit 1
fi
mkdir -p "$BASE_PATH"
APP_DIR="$(cd "$BASE_PATH" && pwd)/$APP_NAME"
# The folder may already exist: every file is created only when it is missing (existing files are kept).
if [ -d "$APP_DIR" ]; then
  echo "Updating $APP_DIR (only missing files are created) ..."
else
  echo "Creating $APP_DIR ..."
fi
mkdir -p "$APP_DIR"
cd "$APP_DIR"

CREATED_COUNT=0
SKIPPED_COUNT=0

# Writes stdin to a file when the file does not exist yet (creates its folder); otherwise keeps the file.
write_file() {
  if [ -e "$1" ]; then
    cat > /dev/null
    echo "  kept     $1"
    SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
    return
  fi
  mkdir -p "$(dirname "$1")"
  cat > "$1"
  echo "  created  $1"
  CREATED_COUNT=$((CREATED_COUNT + 1))
}

# Decodes base64 from stdin into a file (images) when the file does not exist yet.
write_base64() {
  if [ -e "$1" ]; then
    cat > /dev/null
    echo "  kept     $1"
    SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
    return
  fi
  mkdir -p "$(dirname "$1")"
  base64 --decode > "$1"
  echo "  created  $1"
  CREATED_COUNT=$((CREATED_COUNT + 1))
}
""")

for index, path in enumerate(sorted(generated)):
    text = generated[path]
    marker = f"__SHELL_FILE_{index}__"
    if marker in text:
        sys.exit(f"Marker clash in {path}")
    if not text.endswith("\n"):
        text += "\n"
    add(f"# ---------------------------------------------------------------- {path}")
    add(f"write_file '{path}' <<'{marker}'")
    add(text + marker)
    add("")

for path, source in files.items():
    if source.suffix.lower() in IMAGE_SUFFIXES:
        encoded = base64.b64encode(source.read_bytes()).decode("ascii")
        wrapped = "\n".join(encoded[i:i + 76] for i in range(0, len(encoded), 76))
        add(f"# ---------------------------------------------------------------- {path} (image, base64)")
        add(f"write_base64 '{path}' <<'__BASE64__'")
        add(wrapped)
        add("__BASE64__")
        add("")

add("""# ---------------------------------------------------------------- the app name in package.json, index.html, README.md
# (only files just created still have the __APP_NAME__ placeholder)
for name_file in package.json index.html README.md; do
  if grep -q "__APP_NAME__" "$name_file"; then
    APP_NAME="$APP_NAME" node -e 'const fs=require("fs");const f=process.argv[1];fs.writeFileSync(f,fs.readFileSync(f,"utf8").split("__APP_NAME__").join(process.env.APP_NAME));' "$name_file"
  fi
done

echo "Files: $CREATED_COUNT created, $SKIPPED_COUNT already there (kept)."

# ---------------------------------------------------------------- install
# Adds only the packages package.json does not list yet (versions already there are kept), then installs.
missing_packages() {
  node -e 'const p=require("./package.json");const all={...p.dependencies,...p.devDependencies};console.log(process.argv.slice(1).filter((n)=>!all[n]).join(" "));' "$@"
}

echo "Installing packages ..."
MISSING_DEPS="$(missing_packages shared-lib-web react react-dom @preact/signals-react react-hook-form lucide-react dff-util single-spa)"
MISSING_DEV_DEPS="$(missing_packages vite @vitejs/plugin-react tailwindcss @tailwindcss/vite daisyui typescript @types/react @types/react-dom @types/node)"
if [ -n "$MISSING_DEPS" ]; then
  # shellcheck disable=SC2086
  npm install --save $MISSING_DEPS
fi
if [ -n "$MISSING_DEV_DEPS" ]; then
  # shellcheck disable=SC2086
  npm install --save-dev $MISSING_DEV_DEPS
fi
npm install

# ---------------------------------------------------------------- git (only a new repo gets the first commit)
if command -v git >/dev/null 2>&1 && [ ! -d .git ]; then
  git init -q
  git add -A
  git commit -q -m "Initial MFE shell from mfe-shell-web.sh" || true
fi

echo ""
echo "Done. Next:"
echo "  cd $APP_DIR"
echo "  npm run dev      # http://localhost:9000"
echo "MFE urls: public/env.mfe.js"
""")

OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text("\n".join(lines), encoding="utf-8")
OUT.chmod(0o755)
print(f"Wrote {OUT} ({len(generated)} text files, {sum(1 for s in files.values() if s.suffix.lower() in IMAGE_SUFFIXES)} images)")
