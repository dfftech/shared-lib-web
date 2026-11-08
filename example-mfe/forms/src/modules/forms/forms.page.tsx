// forms.page.tsx — the forms page (no auth here: app-forms.tsx checks the access). Loads the option lists.
import { useEffect } from "react";
import { FormsForm } from "./components/forms.form.tsx";
import { roleLoadCall } from "./hooks/service-load.ts";

const RUN_ONCE: never[] = [];

export function FormsPage() {
  useEffect(roleLoadCall, RUN_ONCE);
  return <FormsForm />;
}
