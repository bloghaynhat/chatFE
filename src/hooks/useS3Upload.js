import { useState, useCallback } from "react";
import {
  requestUploadUrl,
  uploadToPresignedUrl,
  confirmUpload,
} from "../services/mediaService";

/**
 * Custom hook for managing S3 presigned URL upload flow
 * @returns {Object} Upload state and methods
 */
export const useS3Upload = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);

  /**
   * Upload file to S3 using presigned URL flow
   * @param {File} file - The file to upload
   * @returns {Promise<Object>} Uploaded file info with fileUrl
   */
  const uploadFile = useCallback(async (file) => {
    try {
      if (!file) {
        throw new Error("File is required");
      }

      setIsUploading(true);
      setError(null);
      setProgress(0);

      // Step 1: Request presigned URL from backend
      const { uploadUrl, fileUrl } = await requestUploadUrl(
        file.name,
        file.type,
      );

      // Step 2: Upload file directly to S3
      await uploadToPresignedUrl(uploadUrl, file, (percentComplete) => {
        setProgress(percentComplete);
      });

      // Step 3: Confirm upload with backend
      const confirmation = await confirmUpload(file.name, fileUrl);

      setUploadedFile({
        ...confirmation,
        fileUrl,
      });

      return {
        ...confirmation,
        fileUrl,
      };
    } catch (err) {
      const errorMessage = err.message || "Upload failed";
      setError(errorMessage);
      throw err;
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  }, []);

  /**
   * Upload multiple files sequentially
   * @param {File[]} files - Array of files to upload
   * @returns {Promise<Array>} Array of uploaded file info
   */
  const uploadMultipleFiles = useCallback(async (files) => {
    try {
      if (!files || files.length === 0) {
        throw new Error("At least one file is required");
      }

      setIsUploading(true);
      setError(null);

      const uploadedFiles = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Update progress based on number of files
        setProgress(Math.round(((i + 1) / files.length) * 100));

        const result = await uploadFile(file);
        uploadedFiles.push(result);
      }

      return uploadedFiles;
    } catch (err) {
      const errorMessage = err.message || "Multiple file upload failed";
      setError(errorMessage);
      throw err;
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  }, [uploadFile]);

  /**
   * Reset upload state
   */
  const reset = useCallback(() => {
    setIsUploading(false);
    setProgress(0);
    setError(null);
    setUploadedFile(null);
  }, []);

  return {
    uploadFile,
    uploadMultipleFiles,
    isUploading,
    progress,
    error,
    uploadedFile,
    reset,
  };
};

export default useS3Upload;
