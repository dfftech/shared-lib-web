// progress-service.ts
// Thin loading bar at the top of the page while requests run.
//
//   ShowProgress(true);  await AppHttp.Get(url);  ShowProgress(false);

import { progressSignal } from "./signals.ts";

let runningCount = 0;

/** Shows (true) or hides (false) the progress bar. Calls are counted, so parallel requests work. */
export function ShowProgress(isRunning: boolean): void {
  if (isRunning) {
    runningCount += 1;
  } else {
    runningCount = Math.max(runningCount - 1, 0);
  }
  progressSignal.value = runningCount > 0;
}
