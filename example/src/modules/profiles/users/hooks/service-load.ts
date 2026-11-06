// Option lists for the user form. Countries come from dff-util.
import { signal } from "@preact/signals-react";
import { Countries, type OptionType } from "dff-util";

export const roleOptions = signal<OptionType[]>([]);
export const countryOptions = signal<OptionType[]>([]);

/** Role options. Texts per language go in option.lang (shown by TypeSelect). */
export function roleLoadCall(): void {
  roleOptions.value = [
    { key: "admin", label: "Admin", lang: { fr: "Administrateur", de: "Administrator", es: "Administrador", ar: "مسؤول", he: "מנהל", fa: "مدیر", ur: "منتظم" } },
    { key: "editor", label: "Editor", lang: { fr: "Éditeur", de: "Bearbeiter", es: "Editor", ar: "محرر", he: "עורך", fa: "ویرایشگر", ur: "مدیر تحریر" } },
    { key: "viewer", label: "Viewer", lang: { fr: "Lecteur", de: "Betrachter", es: "Lector", ar: "مشاهد", he: "צופה", fa: "بیننده", ur: "ناظر" } },
  ];
}

/** Country options from the dff-util Countries list. */
export function countryLoadCall(): void {
  const options: OptionType[] = [];
  for (const country of Countries) {
    const option: OptionType = { key: country.code, label: country.name, icon: country.flag };
    options.push(option);
  }
  countryOptions.value = options;
}
