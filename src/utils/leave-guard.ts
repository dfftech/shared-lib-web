// leave-guard.ts
// Asks the browser to warn before closing or reloading the tab, for example while a file uploads
// or a form has unsaved changes.
//
//   setLeaveGuard(true);   // start of upload
//   setLeaveGuard(false);  // finally

let guardCount = 0;

/** beforeunload handler: tells the browser to ask "Leave site?". */
export function handleBeforeUnload(event: BeforeUnloadEvent): void {
  event.preventDefault();
}

/** Turns the warning on (true) or off (false). Calls are counted, so overlapping uploads work. */
export function setLeaveGuard(isActive: boolean): void {
  const wasActive = guardCount > 0;
  guardCount = isActive ? guardCount + 1 : Math.max(guardCount - 1, 0);
  const isNowActive = guardCount > 0;
  if (isNowActive && !wasActive) {
    window.addEventListener("beforeunload", handleBeforeUnload);
  }
  if (!isNowActive && wasActive) {
    window.removeEventListener("beforeunload", handleBeforeUnload);
  }
}
