// Login HTTP call. This example has no backend, so it accepts any valid form after a short delay.
// In a real app call AppHttp.Post(...) here.
import { signal } from "@preact/signals-react";
import type { LoginType } from "./types.ts";

export const loginIsLoading = signal(false);

const FAKE_DELAY_MS = 400;

function waitForFakeNetwork(resolve: () => void): void {
  setTimeout(resolve, FAKE_DELAY_MS);
}

export async function loginCall(params: LoginType): Promise<boolean> {
  try {
    loginIsLoading.value = true;
    await new Promise<void>(waitForFakeNetwork);
    const hasEmail = params.email.length > 0;
    return hasEmail;
  } finally {
    loginIsLoading.value = false;
  }
}
