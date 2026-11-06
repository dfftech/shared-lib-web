// type.upload.tsx
// Drag & drop file upload with type and size checks.
//   TypeUpload     react-hook-form field (control + name)
//   TypeUploadBox  controlled (value + onChange), for uploads outside a form
//
// The value is one File (single) or File[] (isMultiple), or null.
//
//   <TypeUpload control={control} name="csvFile" label={t("product.csv")} fileType="csv" maxSize="10MB"
//               rules={{ required: { value: true, message: ConstKeys.REQUIRED } }} />
//   <TypeUpload control={control} name="photos" label={t("product.photos")} fileType={["image/*"]}
//               maxSize="5MB" isMultiple totalSize="20MB" />
//   <TypeUploadBox name="import" fileType="csv" maxSize={10} value={importFile.value} onChange={handleImportFileChange} />
//
// Upload a picked file to a signed URL with uploadToSignedUrl(file, uploadUrl, downloadUrl).

import { useId, type ReactElement, type ReactNode } from "react";
import { useController, type FieldValues } from "react-hook-form";
import { useUi } from "../context/use-ui.ts";
import { formatBytes, normalizeFileTypes, parseSizeToBytes, readFileIconName, sumFileSizes } from "../utils/file-util.ts";
import { readFieldErrorText } from "./field-error.ts";
import type { TypeFieldProps } from "./field-props.ts";
import { TypeIcon, type IconName } from "./type.icon.ts";
import {
  handleUploadAreaClick,
  handleUploadAreaKeyDown,
  handleUploadDragLeave,
  handleUploadDragOver,
  handleUploadDrop,
  handleUploadInputChange,
  handleUploadRemoveClick,
  handleUploadWarningClose,
  readUploadFiles,
  registerUploadBinding,
  uploadWarningsSignal,
  type UploadValue,
} from "./upload-service.ts";

export interface UploadOptions {
  /** Allowed types: "csv", ["png", "jpg"], "application/pdf", "image/*". */
  fileType: string | string[];
  /** Max size per file: 10 (= 10 MB), "500KB", "10MB". */
  maxSize: number | string;
  /** Allow several files. */
  isMultiple?: boolean;
  /** Max combined size when isMultiple (same formats as maxSize). */
  totalSize?: number | string;
  /** lucide icon in the drop zone. Default "Upload". */
  icon?: IconName;
  /** Title (already translated). Default: translated "Drag & drop your files here". */
  title?: string;
  /** Sub title (already translated). Default: "Supports CSV files." */
  subtitle?: string;
  /** Browse button text (already translated). */
  buttonLabel?: string;
  /** Show the picked files under the drop zone. Default true. */
  showFileList?: boolean;
  /** Extra content per file row (for example a status badge). Use a top-level function. */
  fileExtra?: (file: File, index: number) => ReactNode;
  /** Called with the warning text when a file is refused. */
  onError?: (message: string) => void;
}

export type TypeUploadProps<TFieldValues extends FieldValues> = TypeFieldProps<TFieldValues> & UploadOptions;

export interface TypeUploadBoxProps extends UploadOptions {
  /** Unique name of this upload area. */
  name: string;
  /** Text above the drop zone (already translated). */
  label?: string;
  value: UploadValue;
  onChange: (value: UploadValue) => void;
  /** Error text under the drop zone (already translated). */
  errorText?: string;
  disabled?: boolean;
  className?: string;
}

interface UploadViewProps extends UploadOptions {
  uploadId: string;
  label?: string;
  value: unknown;
  onValueChange: (value: UploadValue) => void;
  errorText?: string;
  hint?: string;
  isDisabled: boolean;
  className?: string;
}

/** Builds one row per picked file. */
function buildFileRows(
  files: File[],
  isDisabled: boolean,
  removeText: string,
  fileExtra: UploadOptions["fileExtra"],
): ReactElement[] {
  const rows: ReactElement[] = [];
  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    if (!file) {
      continue;
    }
    const iconName = readFileIconName(file);
    const sizeText = formatBytes(file.size);
    const extraContent = fileExtra ? fileExtra(file, index) : null;
    const row = (
      <li key={`${file.name}-${file.size}-${index}`} className="flex items-center gap-3 rounded-box border border-base-300 bg-base-100 p-3 text-sm">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-field bg-primary/10 text-primary">
          <TypeIcon name={iconName} size={18} />
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-medium">{file.name}</span>
          <span className="text-xs opacity-60">{sizeText}</span>
        </span>
        {extraContent}
        {isDisabled ? null : (
          <button
            type="button"
            className="btn btn-ghost btn-sm btn-square text-error"
            aria-label={`${removeText} ${file.name}`}
            title={removeText}
            data-file-index={index}
            onClick={handleUploadRemoveClick}
          >
            <TypeIcon name="Trash2" size={16} />
          </button>
        )}
      </li>
    );
    rows.push(row);
  }
  return rows;
}

/** The drop zone, warning, error and file list. Shared by TypeUpload and TypeUploadBox. */
function UploadView(props: UploadViewProps) {
  const {
    uploadId,
    label,
    value,
    onValueChange,
    errorText,
    hint,
    isDisabled,
    className,
    fileType,
    maxSize,
    isMultiple = false,
    totalSize,
    icon = "Upload",
    title,
    subtitle,
    buttonLabel,
    showFileList = true,
    fileExtra,
    onError,
  } = props;
  const { t } = useUi();
  const rules = normalizeFileTypes(fileType);
  const maxSizeBytes = parseSizeToBytes(maxSize);
  const totalSizeBytes = isMultiple && totalSize !== undefined ? parseSizeToBytes(totalSize) : 0;
  const files = readUploadFiles(value);
  const settings = { rules: rules, maxSizeBytes: maxSizeBytes, totalSizeBytes: totalSizeBytes, isMultiple: isMultiple, isDisabled: isDisabled };
  const binding = { settings: settings, files: files, onValueChange: onValueChange, onError: onError };
  registerUploadBinding(uploadId, binding);

  const warningText = uploadWarningsSignal.value[uploadId];
  const maxText = formatBytes(maxSizeBytes);
  const totalText = formatBytes(totalSizeBytes);
  const typesParams = { types: rules.displayText };
  const limitParams = { max: maxText, total: totalText };
  const defaultTitle = t("ui.uploadTitle");
  const defaultSubtitle = t("ui.uploadSubtitle", typesParams);
  const defaultButton = t("ui.browseFiles");
  const limitKey = totalSizeBytes > 0 ? "ui.uploadLimitTotal" : "ui.uploadLimit";
  const limitText = t(limitKey, limitParams);
  const removeText = t("ui.removeFile");
  const closeText = t("ui.close");
  const selectedParams = { count: files.length };
  const selectedText = t("ui.selectedFiles", selectedParams);
  const usedBytes = sumFileSizes(files);
  const usedText = formatBytes(usedBytes);
  const fileRows = buildFileRows(files, isDisabled, removeText, fileExtra);
  const zoneClassName = isDisabled
    ? "flex cursor-not-allowed flex-col items-center gap-2 rounded-box border-2 border-dashed border-base-300 bg-base-200/40 p-8 text-center opacity-50"
    : "flex cursor-pointer flex-col items-center gap-2 rounded-box border-2 border-dashed border-base-300 bg-base-200/40 p-8 text-center transition-colors hover:border-primary hover:bg-base-200 focus-visible:outline-2 focus-visible:outline-primary data-[dragging=true]:border-primary data-[dragging=true]:bg-primary/10";
  const wrapperClassName = className ? `fieldset ${className}` : "fieldset";
  const hasError = Boolean(errorText);

  return (
    <fieldset className={wrapperClassName} data-upload-id={uploadId}>
      {label ? <legend className="fieldset-legend">{label}</legend> : null}
      <input
        type="file"
        className="hidden"
        tabIndex={-1}
        accept={rules.acceptText}
        multiple={isMultiple}
        disabled={isDisabled}
        onChange={handleUploadInputChange}
        aria-hidden="true"
      />
      <div
        role="button"
        tabIndex={isDisabled ? -1 : 0}
        aria-disabled={isDisabled}
        aria-invalid={hasError}
        aria-label={title ?? defaultTitle}
        className={zoneClassName}
        onClick={isDisabled ? undefined : handleUploadAreaClick}
        onKeyDown={isDisabled ? undefined : handleUploadAreaKeyDown}
        onDragOver={handleUploadDragOver}
        onDragLeave={handleUploadDragLeave}
        onDrop={isDisabled ? undefined : handleUploadDrop}
      >
        <span className="flex size-14 items-center justify-center rounded-box border border-base-300 bg-base-100 text-primary shadow-sm">
          <TypeIcon name={icon} size={26} />
        </span>
        <span className="text-base font-bold">{title ?? defaultTitle}</span>
        <span className="text-sm opacity-60">{subtitle ?? defaultSubtitle}</span>
        <span className="badge badge-ghost badge-sm">{limitText}</span>
        <span className="btn btn-primary btn-sm mt-3 pointer-events-none">
          <TypeIcon name="Upload" size={16} />
          {buttonLabel ?? defaultButton}
        </span>
      </div>
      {warningText ? (
        <div role="alert" className="alert alert-warning alert-soft mt-2 text-sm">
          <TypeIcon name="TriangleAlert" size={16} />
          <span className="flex-1">{warningText}</span>
          <button type="button" className="btn btn-ghost btn-xs btn-square" aria-label={closeText} onClick={handleUploadWarningClose}>
            <TypeIcon name="X" size={14} />
          </button>
        </div>
      ) : null}
      {errorText ? <p className="label text-error">{errorText}</p> : hint ? <p className="label">{hint}</p> : null}
      {showFileList && files.length > 0 ? (
        <div className="mt-2 flex flex-col gap-2">
          <div className="flex justify-between px-1 text-xs font-semibold opacity-60">
            <span>{selectedText}</span>
            {totalSizeBytes > 0 ? (
              <span>
                {usedText} / {totalText}
              </span>
            ) : null}
          </div>
          <ul className="flex flex-col gap-2">{fileRows}</ul>
        </div>
      ) : null}
    </fieldset>
  );
}

export function TypeUpload<TFieldValues extends FieldValues>(props: TypeUploadProps<TFieldValues>) {
  const { control, name, label, rules, error, hint, disabled = false, className, ...uploadOptions } = props;
  const { t } = useUi();
  const uploadId = useId();
  const controllerOptions = { control: control, name: name, rules: rules, disabled: disabled };
  const { field, fieldState } = useController(controllerOptions);
  const fieldError = error ?? fieldState.error;
  const errorText = readFieldErrorText(fieldError, t);
  const isDisabled = Boolean(field.disabled) || disabled;

  return (
    <UploadView
      {...uploadOptions}
      uploadId={uploadId}
      label={label}
      value={field.value}
      onValueChange={field.onChange}
      errorText={errorText}
      hint={hint}
      isDisabled={isDisabled}
      className={className}
    />
  );
}

export function TypeUploadBox(props: TypeUploadBoxProps) {
  const { name, label, value, onChange, errorText, disabled = false, className, ...uploadOptions } = props;
  const uploadId = `upload-${name}`;

  return (
    <UploadView
      {...uploadOptions}
      uploadId={uploadId}
      label={label}
      value={value}
      onValueChange={onChange}
      errorText={errorText}
      isDisabled={disabled}
      className={className}
    />
  );
}
