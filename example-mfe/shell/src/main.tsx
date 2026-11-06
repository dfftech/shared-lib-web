// main.tsx — shell entry. Listens for session events, then renders the shell (it reads the saved layout).
// The shell is 5 files: config.ts (settings), session.ts (sign in/out + menu), mfe.ts (single-spa from env.mfe.js),
// shell.tsx (layout, login, home), main.tsx (this file).
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { Root } from "./shell.tsx";
import { listenForSession } from "./session.ts";

listenForSession();

const rootElement = document.getElementById("root");

if (rootElement) {
  const root = createRoot(rootElement);
  root.render(
    <StrictMode>
      <Root />
    </StrictMode>,
  );
}
