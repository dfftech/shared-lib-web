// upload-service.ts
// Logic of TypeUpload / TypeUploadBox without arrow functions inside components.
// Each upload area registers its current settings, files and change function under an id
// (data-upload-id). The top-level event handlers below look the area up by that id.

import { signal } from "@preact/signals-react";
import { ConstValue } from "dff-util";
import type { ChangeEvent, DragEvent, KeyboardEvent, MouseEvent } from "react";
import { translate } from "../i18n/translator.ts";
import { ShowToast } from "../state/toast-service.ts";
import { formatBytes, isFileTypeAllowed, sumFileSizes, type FileTypeRules } from "../utils/file-util.ts";

/** Form value of an upload: one File, several Files, or nothing. */
export type UploadValue = File | File[] | null;

export interface UploadSettings {
  rules: FileTypeRules;
  maxSizeBytes: number;
  /** Combined limit for multiple files (0 = no limit). */
  totalSizeBytes: number;
  isMultiple: boolean;
  isDisabled: boolean;
}

export interface UploadBinding {
  settings: UploadSettings;
  files: File[];
  onValueChange: (value: UploadValue) => void;
  onError?: (message: string) => void;
}

const uploadBindings = new Map<string, UploadBinding>();

/** Last warning per upload area id. */
export const uploadWarningsSignal = signal<Record<string, string>>({});

/** Saves the latest settings and change function of an upload area. Called while it renders. */
export function registerUploadBinding(uploadId: string, binding: UploadBinding): void {
  uploadBindings.set(uploadId, binding);
}

/** Turns the form value into a file list. */
export function readUploadFiles(value: unknown): File[] {
  if (Array.isArray(value)) {
    const files: File[] = [];
    for (const item of value) {
      if (item instanceof File) {
        files.push(item);
      }
    }
    return files;
  }
  if (value instanceof File) {
    return [value];
  }
  return [];
}

/** Sets (or clears with "") the warning of one upload area. */
export function setUploadWarning(uploadId: string, message: string): void {
  const currentWarnings = uploadWarningsSignal.value;
  const nextWarnings = { ...currentWarnings, [uploadId]: message };
  uploadWarningsSignal.value = nextWarnings;
}

/** Shows a warning in the area, as a toast, and tells the app. */
function reportUploadProblem(uploadId: string, binding: UploadBinding, message: string): void {
  setUploadWarning(uploadId, message);
  ShowToast(message, "warning");
  if (binding.onError) {
    binding.onError(message);
  }
}

/** Returns the first validation problem of the new files, or "" when they are fine. */
export function findUploadProblem(candidates: File[], currentFiles: File[], settings: UploadSettings): string {
  for (const file of candidates) {
    const isAllowed = isFileTypeAllowed(file, settings.rules);
    if (!isAllowed) {
      const typeParams = { name: file.name, types: settings.rules.displayText };
      return translate("ui.uploadTypeError", typeParams);
    }
    if (file.size > settings.maxSizeBytes) {
      const fileSizeText = formatBytes(file.size);
      const maxSizeText = formatBytes(settings.maxSizeBytes);
      const sizeParams = { name: file.name, size: fileSizeText, max: maxSizeText };
      return translate("ui.uploadSizeError", sizeParams);
    }
  }
  const hasTotalLimit = settings.isMultiple && settings.totalSizeBytes > 0;
  if (!hasTotalLimit) {
    return ConstValue.EMPTY;
  }
  const allFiles = [...currentFiles, ...candidates];
  const combinedBytes = sumFileSizes(allFiles);
  if (combinedBytes > settings.totalSizeBytes) {
    const combinedText = formatBytes(combinedBytes);
    const totalText = formatBytes(settings.totalSizeBytes);
    const totalParams = { size: combinedText, max: totalText };
    return translate("ui.uploadTotalError", totalParams);
  }
  return ConstValue.EMPTY;
}

/** Validates new files and passes them to the form (single: the first file; multiple: added to the list). */
export function processUploadFiles(uploadId: string, incomingFiles: File[]): void {
  const binding = uploadBindings.get(uploadId);
  if (!binding || binding.settings.isDisabled || incomingFiles.length === 0) {
    return;
  }
  const settings = binding.settings;
  const firstFile = incomingFiles[0];
  const candidates = settings.isMultiple || !firstFile ? incomingFiles : [firstFile];
  const currentFiles = settings.isMultiple ? binding.files : [];
  const problem = findUploadProblem(candidates, currentFiles, settings);
  if (problem) {
    reportUploadProblem(uploadId, binding, problem);
    return;
  }
  setUploadWarning(uploadId, ConstValue.EMPTY);
  if (settings.isMultiple) {
    const nextFiles = [...currentFiles, ...candidates];
    binding.onValueChange(nextFiles);
    return;
  }
  binding.onValueChange(candidates[0] ?? null);
}

/** Finds the hidden file input of the upload area and opens the file picker. */
function openFilePicker(areaElement: HTMLElement | null): void {
  if (!areaElement) {
    return;
  }
  const fileInput = areaElement.querySelector<HTMLInputElement>("input[type=file]");
  if (fileInput && !fileInput.disabled) {
    fileInput.click();
  }
}

/** Reads the upload id from the closest element with data-upload-id. */
function readUploadId(element: HTMLElement): string {
  const area = element.closest<HTMLElement>("[data-upload-id]");
  return area?.dataset.uploadId ?? ConstValue.EMPTY;
}

/** Click on the drop zone or the browse button opens the picker. */
export function handleUploadAreaClick(event: MouseEvent<HTMLElement>): void {
  event.stopPropagation();
  const element = event.currentTarget;
  const area = element.closest<HTMLElement>("[data-upload-id]");
  openFilePicker(area);
}

/** Enter or Space on the drop zone opens the picker. */
export function handleUploadAreaKeyDown(event: KeyboardEvent<HTMLElement>): void {
  const isActivateKey = event.key === "Enter" || event.key === " ";
  if (!isActivateKey) {
    return;
  }
  event.preventDefault();
  const area = event.currentTarget;
  openFilePicker(area);
}

/** Marks the drop zone while a file is dragged over it. */
export function handleUploadDragOver(event: DragEvent<HTMLElement>): void {
  event.preventDefault();
  const area = event.currentTarget;
  area.dataset.dragging = "true";
}

/** Removes the drag mark. */
export function handleUploadDragLeave(event: DragEvent<HTMLElement>): void {
  event.preventDefault();
  const area = event.currentTarget;
  area.dataset.dragging = "false";
}

/** Takes the dropped files. */
export function handleUploadDrop(event: DragEvent<HTMLElement>): void {
  event.preventDefault();
  const area = event.currentTarget;
  area.dataset.dragging = "false";
  const uploadId = readUploadId(area);
  const droppedFiles = event.dataTransfer.files;
  const files = Array.from(droppedFiles);
  processUploadFiles(uploadId, files);
}

/** Takes the files picked in the browser dialog, then clears the input so the same file can be picked again. */
export function handleUploadInputChange(event: ChangeEvent<HTMLInputElement>): void {
  const input = event.currentTarget;
  const uploadId = readUploadId(input);
  const pickedFiles = input.files ?? [];
  const files = Array.from(pickedFiles);
  processUploadFiles(uploadId, files);
  input.value = ConstValue.EMPTY;
}

/** Removes the file whose index is in data-file-index. */
export function handleUploadRemoveClick(event: MouseEvent<HTMLButtonElement>): void {
  event.stopPropagation();
  const button = event.currentTarget;
  const uploadId = readUploadId(button);
  const binding = uploadBindings.get(uploadId);
  if (!binding) {
    return;
  }
  const indexText = button.dataset.fileIndex ?? "-1";
  const removeIndex = Number(indexText);
  const remainingFiles: File[] = [];
  for (let index = 0; index < binding.files.length; index += 1) {
    const file = binding.files[index];
    if (file && index !== removeIndex) {
      remainingFiles.push(file);
    }
  }
  setUploadWarning(uploadId, ConstValue.EMPTY);
  const nextValue = binding.settings.isMultiple ? remainingFiles : null;
  binding.onValueChange(nextValue);
}

/** Closes the warning banner. */
export function handleUploadWarningClose(event: MouseEvent<HTMLButtonElement>): void {
  event.stopPropagation();
  const button = event.currentTarget;
  const uploadId = readUploadId(button);
  setUploadWarning(uploadId, ConstValue.EMPTY);
}
