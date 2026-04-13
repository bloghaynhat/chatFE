import React, { useCallback, useRef } from "react";
import { useS3Upload } from "../../hooks/useS3Upload";

/**
 * FileUploader Component
 * A reusable component for uploading files to S3 with presigned URLs
 *
 * @param {Object} props
 * @param {Function} props.onUploadSuccess - Callback when upload succeeds (receives uploadedFile)
 * @param {Function} props.onUploadError - Callback when upload fails (receives error)
 * @param {boolean} props.multiple - Allow multiple file selection
 * @param {string} props.accept - File type filter (e.g., "image/*", ".pdf")
 * @param {string} props.className - CSS class for the component
 * @param {boolean} props.disabled - Disable the uploader
 * @returns {JSX.Element}
 */
export const FileUploader = ({
  onUploadSuccess,
  onUploadError,
  multiple = false,
  accept = "*/*",
  className = "",
  disabled = false,
}) => {
  const fileInputRef = useRef(null);
  const { uploadFile, uploadMultipleFiles, isUploading, progress, error } = useS3Upload();

  const handleFileChange = useCallback(
    async (event) => {
      const files = event.target.files;
      if (!files || files.length === 0) return;

      try {
        if (multiple && files.length > 1) {
          const results = await uploadMultipleFiles(Array.from(files));
          if (onUploadSuccess) {
            onUploadSuccess(results);
          }
        } else {
          const result = await uploadFile(files[0]);
          if (onUploadSuccess) {
            onUploadSuccess(result);
          }
        }
      } catch (err) {
        if (onUploadError) {
          onUploadError(err);
        }
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [uploadFile, uploadMultipleFiles, multiple, onUploadSuccess, onUploadError],
  );

  const handleClick = () => {
    if (!disabled && !isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={accept}
        onChange={handleFileChange}
        disabled={disabled || isUploading}
        className="hidden"
      />

      <button
        onClick={handleClick}
        disabled={disabled || isUploading}
        className="relative w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isUploading ? (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            <span>Uploading {Math.round(progress)}%</span>
          </div>
        ) : (
          <span>Choose File{multiple ? "s" : ""}</span>
        )}
      </button>

      {error && <div className="mt-2 text-sm text-red-500">{error}</div>}
    </div>
  );
};

export default FileUploader;
