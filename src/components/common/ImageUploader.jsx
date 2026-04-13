import React, { useCallback, useRef } from "react";
import { useS3Upload } from "../../hooks/useS3Upload";

/**
 * ImageUploader Component
 * A specialized component for uploading images to S3 with preview
 *
 * @param {Object} props
 * @param {Function} props.onUploadSuccess - Callback when upload succeeds (receives imageFile)
 * @param {Function} props.onUploadError - Callback when upload fails (receives error)
 * @param {string} props.className - CSS class for the component
 * @param {boolean} props.disabled - Disable the uploader
 * @returns {JSX.Element}
 */
export const ImageUploader = ({
  onUploadSuccess,
  onUploadError,
  className = "",
  disabled = false,
}) => {
  const fileInputRef = useRef(null);
  const [preview, setPreview] = React.useState(null);
  const { uploadFile, isUploading, progress, error } = useS3Upload();

  const handleFileChange = useCallback(
    async (event) => {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate image type
      if (!file.type.startsWith("image/")) {
        if (onUploadError) {
          onUploadError(new Error("Please select a valid image file"));
        }
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target.result);
      };
      reader.readAsDataURL(file);

      try {
        const result = await uploadFile(file);
        if (onUploadSuccess) {
          onUploadSuccess(result);
        }
      } catch (err) {
        setPreview(null);
        if (onUploadError) {
          onUploadError(err);
        }
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [uploadFile, onUploadSuccess, onUploadError],
  );

  const handleClick = () => {
    if (!disabled && !isUploading && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleClearPreview = () => {
    setPreview(null);
  };

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={disabled || isUploading}
        className="hidden"
      />

      {preview ? (
        <div className="relative inline-block">
          <img
            src={preview}
            alt="Preview"
            className="w-32 h-32 object-cover rounded border border-gray-300"
          />
          {!isUploading && (
            <button
              onClick={handleClearPreview}
              className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={handleClick}
          disabled={disabled || isUploading}
          className="relative w-32 h-32 border-2 border-dashed border-gray-300 rounded hover:border-blue-500 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
        >
          {isUploading ? (
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-xs text-gray-600">{Math.round(progress)}%</span>
            </div>
          ) : (
            <div className="text-center">
              <svg className="w-8 h-8 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span className="text-xs text-gray-500 mt-1">Upload Image</span>
            </div>
          )}
        </button>
      )}

      {error && <div className="mt-2 text-sm text-red-500">{error}</div>}
    </div>
  );
};

export default ImageUploader;
