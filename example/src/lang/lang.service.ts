// lang.service.ts
// The languages of the example. They are NOT in config.ts: they come from the backend when the app starts.
//
//   langSignal.value = null;       // first value: config.defaultLanguage (en-US) is shown, no list yet
//   langSignal.value = reply;      // the API answered: the switchers list the languages
//
// root.tsx passes it on and calls loadLanguages once (after the provider has registered the config,
// because AppHttp reads the saved config). The "backend" is a static file: public/api/app-api/languages.json.
import { signal } from "@preact/signals-react";
import { AppHttp, type LangSource } from "shared-lib-web";
import { MsUrl } from "../config.ts";

/** null = not loaded yet; a reply = the languages to offer. */
export const langSignal = signal<LangSource | null>(null);

/** GET the languages of the app. */
async function fetchLanguages(): Promise<LangSource> {
  const languagesUrl = `${MsUrl.main}/languages.json`;
  const reply = await AppHttp.Get(languagesUrl);
  return reply as LangSource;
}

/** Loads the languages. On an error the app keeps the default language. */
export async function loadLanguages(): Promise<void> {
  try {
    const reply = await fetchLanguages();
    langSignal.value = reply;
  } catch {
    langSignal.value = null;
  }
}

/** For useEffect: loads the languages once when the app starts. */
export function loadLanguagesOnMount(): void {
  void loadLanguages();
}
