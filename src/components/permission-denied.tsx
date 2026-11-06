// permission-denied.tsx
// Shown instead of a page when the user has no access (see RequireAccess).

import { useUi } from "../context/use-ui.ts";
import { TypeIcon } from "../types/type.icon.ts";

export function PermissionDenied() {
  const { t } = useUi();
  const titleText = t("ui.permissionDenied");
  const bodyText = t("ui.permissionDeniedText");

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 p-8 text-center">
      <span className="flex size-20 items-center justify-center rounded-3xl bg-error/10 text-error">
        <TypeIcon name="ShieldX" size={40} />
      </span>
      <h2 className="text-2xl font-bold">{titleText}</h2>
      <p className="max-w-md text-base-content/70">{bodyText}</p>
    </div>
  );
}
