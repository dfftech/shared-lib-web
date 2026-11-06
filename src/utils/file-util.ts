// file-util.ts
// File helpers used by TypeUpload, also usable on their own.
//
//   parseSizeToBytes("10MB")            -> 10485760
//   formatBytes(10485760)               -> "10 MB"
//   normalizeFileTypes(["csv", "image/*"]) -> { extensions, mimeTypes, acceptText: ".csv,image/*", displayText: "CSV, IMAGE" }
//   isFileTypeAllowed(file, fileTypes)  -> true / false

import { ConstValue } from "dff-util";
import type { IconName } from "../types/type.icon.ts";

const BYTES_PER_KB = 1024;
const SIZE_PATTERN = /^(\d+(?:\.\d+)?)\s*(B|KB|K|MB|M|GB|G)?$/i;
const SIZE_UNITS = ["B", "KB", "MB", "GB"];

/** Multiplier for a size unit. */
function readUnitBytes(unit: string): number {
  if (unit === "GB" || unit === "G") {
    return BYTES_PER_KB * BYTES_PER_KB * BYTES_PER_KB;
  }
  if (unit === "MB" || unit === "M") {
    return BYTES_PER_KB * BYTES_PER_KB;
  }
  if (unit === "KB" || unit === "K") {
    return BYTES_PER_KB;
  }
  return 1;
}

/**
 * Turns a size into bytes.
 * Numbers up to 1024 are megabytes (5 -> 5 MB), bigger numbers are bytes.
 * Text: "500KB", "10 MB", "1.5GB", "2048" (bytes).
 */
export function parseSizeToBytes(size: number | string): number {
  if (typeof size === "number") {
    const isMegabytes = size <= BYTES_PER_KB;
    const bytes = isMegabytes ? size * BYTES_PER_KB * BYTES_PER_KB : size;
    return Math.round(bytes);
  }
  const trimmedSize = size.trim();
  const upperSize = trimmedSize.toUpperCase();
  const match = SIZE_PATTERN.exec(upperSize);
  if (!match) {
    return 0;
  }
  const numberText = match[1] ?? "0";
  const sizeNumber = parseFloat(numberText);
  const unit = match[2];
  if (!unit) {
    return parseSizeToBytes(sizeNumber);
  }
  const unitBytes = readUnitBytes(unit);
  return Math.round(sizeNumber * unitBytes);
}

/** Readable size: 1536 -> "1.5 KB". */
export function formatBytes(bytes: number): string {
  if (bytes <= 0) {
    return "0 B";
  }
  let unitIndex = 0;
  let value = bytes;
  while (value >= BYTES_PER_KB && unitIndex < SIZE_UNITS.length - 1) {
    value = value / BYTES_PER_KB;
    unitIndex += 1;
  }
  const roundedValue = Math.round(value * 10) / 10;
  const unit = SIZE_UNITS[unitIndex] ?? "B";
  return `${roundedValue} ${unit}`;
}

export interface FileTypeRules {
  /** Lower-case extensions without dot: ["csv", "png"]. */
  extensions: string[];
  /** MIME types: ["application/pdf", "image/*"]. */
  mimeTypes: string[];
  /** Value for <input accept>: ".csv,.png,application/pdf". */
  acceptText: string;
  /** Readable list: "CSV, PNG, PDF". */
  displayText: string;
}

/** Splits "csv, png" or ["csv", "image/*"] into extensions and MIME types. */
export function normalizeFileTypes(fileType: string | string[]): FileTypeRules {
  const rawList = Array.isArray(fileType) ? fileType : fileType.split(ConstValue.COMMA);
  const extensions: string[] = [];
  const mimeTypes: string[] = [];
  const displayNames: string[] = [];
  const acceptList: string[] = [];
  for (const rawItem of rawList) {
    const trimmedItem = rawItem.trim();
    const item = trimmedItem.toLowerCase();
    if (item.length === 0) {
      continue;
    }
    const isMimeType = item.includes(ConstValue.SLASH);
    if (isMimeType) {
      mimeTypes.push(item);
      acceptList.push(item);
      const mimeParts = item.split(ConstValue.SLASH);
      const subType = mimeParts[1] ?? item;
      const displayName = subType === ConstValue.ASTERISK ? mimeParts[0] ?? item : subType;
      const upperName = displayName.toUpperCase();
      displayNames.push(upperName);
      continue;
    }
    const extension = item.startsWith(ConstValue.PERIOD) ? item.slice(1) : item;
    extensions.push(extension);
    acceptList.push(`.${extension}`);
    const upperExtension = extension.toUpperCase();
    displayNames.push(upperExtension);
  }
  const uniqueNames = new Set(displayNames);
  const uniqueNameList = Array.from(uniqueNames);
  return {
    extensions: extensions,
    mimeTypes: mimeTypes,
    acceptText: acceptList.join(ConstValue.COMMA),
    displayText: uniqueNameList.join(", "),
  };
}

/** Lower-case extension of a file name: "Report.CSV" -> "csv". */
export function readFileExtension(fileName: string): string {
  const nameParts = fileName.split(ConstValue.PERIOD);
  const lastPart = nameParts.length > 1 ? nameParts[nameParts.length - 1] ?? ConstValue.EMPTY : ConstValue.EMPTY;
  return lastPart.toLowerCase();
}

/** true when the file matches one of the allowed extensions or MIME types (empty rules allow all). */
export function isFileTypeAllowed(file: File, rules: FileTypeRules): boolean {
  const hasRules = rules.extensions.length > 0 || rules.mimeTypes.length > 0;
  if (!hasRules) {
    return true;
  }
  const extension = readFileExtension(file.name);
  const isExtensionAllowed = rules.extensions.includes(extension);
  if (isExtensionAllowed) {
    return true;
  }
  for (const mimeType of rules.mimeTypes) {
    const isWildcard = mimeType.endsWith("/*");
    if (isWildcard) {
      const category = mimeType.slice(0, -1);
      const isCategoryMatch = file.type.startsWith(category);
      if (isCategoryMatch) {
        return true;
      }
      continue;
    }
    if (file.type === mimeType) {
      return true;
    }
  }
  return false;
}

/** Sum of all file sizes in bytes. */
export function sumFileSizes(files: File[]): number {
  let totalBytes = 0;
  for (const file of files) {
    totalBytes += file.size;
  }
  return totalBytes;
}

/** lucide icon for a file: spreadsheet, image, PDF/text or generic. */
export function readFileIconName(file: File): IconName {
  const extension = readFileExtension(file.name);
  const isSheet = ["csv", "xls", "xlsx"].includes(extension) || file.type.includes("csv") || file.type.includes("sheet");
  if (isSheet) {
    return "FileSpreadsheet";
  }
  if (file.type.startsWith("image/")) {
    return "FileImage";
  }
  if (file.type.startsWith("video/")) {
    return "FileVideo";
  }
  const isText = extension === "pdf" || file.type.startsWith("text/") || file.type === "application/pdf";
  if (isText) {
    return "FileText";
  }
  return "File";
}
