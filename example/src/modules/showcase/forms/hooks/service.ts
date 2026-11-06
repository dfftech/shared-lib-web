// State of the forms showcase: the last submitted values.
import { signal } from "@preact/signals-react";
import { ShowToast, formatBytes, translate } from "shared-lib-web";
import type { UseFormReset } from "react-hook-form";
import { getDefaultShowcase } from "./data.ts";
import type { ShowcaseFormType } from "./types.ts";

export const showcaseSubmitted = signal<ShowcaseFormType | null>(null);

/** reset() of the current form (set by useFormsPage), used by the Cancel button in the page header. */
let showcaseReset: UseFormReset<ShowcaseFormType> | null = null;

export function setShowcaseReset(reset: UseFormReset<ShowcaseFormType>): void {
  showcaseReset = reset;
}

/** Cancel: back to the default values and no submitted preview. */
export function handleShowcaseCancel(): void {
  const defaultValues = getDefaultShowcase();
  showcaseReset?.(defaultValues);
  showcaseSubmitted.value = null;
}

/** File objects can not be shown as JSON, so they are replaced by "name (size)". */
export function describeFile(file: File): string {
  const sizeText = formatBytes(file.size);
  return `${file.name} (${sizeText})`;
}

export function handleShowcaseSubmit(values: ShowcaseFormType): void {
  const photoNames: string[] = [];
  for (const photo of values.photos) {
    const photoText = describeFile(photo);
    photoNames.push(photoText);
  }
  const csvText = values.csvFile ? describeFile(values.csvFile) : null;
  const printableValues = { ...values, csvFile: csvText, photos: photoNames } as unknown as ShowcaseFormType;
  showcaseSubmitted.value = printableValues;
  const message = translate("demo.submitted");
  ShowToast(message, "success");
}
