import { getApiBaseUrl } from "../runtime/config";
import { authStorage } from "../runtime/storage";

/**
 * Upload a single file to the media endpoint
 * @param {File} file - The file to upload
 * @returns {Promise<Object>} Response data containing: filename, url, originalName, size, mimetype
 */
export const uploadMedia = async (file) => {
  try {
    if (!file) {
      throw new Error("File is required");
    }

    const formData = new FormData();
    formData.append("file", file);

    const token = await authStorage.getItem("token");
    const response = await fetch(`${getApiBaseUrl()}/media/upload`, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Upload failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Media upload failed:", error);
    throw new Error(error.message || "Failed to upload file");
  }
};

/**
 * Upload multiple files to the media endpoint
 * @param {File[]} files - Array of files to upload
 * @returns {Promise<Array>} Response data containing array of uploaded file info
 */
export const uploadMultipleMedia = async (files) => {
  try {
    if (!files || files.length === 0) {
      throw new Error("At least one file is required");
    }

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    const token = await authStorage.getItem("token");
    const response = await fetch(`${getApiBaseUrl()}/media/upload-multiple`, {
      method: "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Upload failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Media upload failed:", error);
    throw new Error(error.message || "Failed to upload files");
  }
};

/**
 * Request presigned upload URL from backend
 * @param {string} fileName - The filename
 * @param {string} contentType - The MIME type
 * @returns {Promise<Object>} Response data containing: uploadUrl, fileUrl
 */
export const requestUploadUrl = async (fileName, contentType) => {
  try {
    if (!fileName || !contentType) {
      throw new Error("fileName and contentType are required");
    }

    const token = await authStorage.getItem("token");
    const response = await fetch(`${getApiBaseUrl()}/media/request-upload-url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        fileName,
        contentType,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to request upload URL with status ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Request upload URL failed:", error);
    throw new Error(error.message || "Failed to request upload URL");
  }
};

/**
 * Upload file directly to S3 using presigned URL
 * @param {string} uploadUrl - The presigned upload URL
 * @param {File} file - The file to upload
 * @param {Function} onProgress - Callback for upload progress (optional)
 * @returns {Promise<void>}
 */
export const uploadToPresignedUrl = async (uploadUrl, file, onProgress) => {
  try {
    if (!uploadUrl || !file) {
      throw new Error("uploadUrl and file are required");
    }

    const xhr = new XMLHttpRequest();

    // Track upload progress
    if (onProgress) {
      xhr.upload.addEventListener("progress", (event) => {
        if (event.lengthComputable) {
          const percentComplete = (event.loaded / event.total) * 100;
          onProgress(percentComplete);
        }
      });
    }

    return new Promise((resolve, reject) => {
      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Upload failed due to network error"));
      });

      xhr.addEventListener("abort", () => {
        reject(new Error("Upload was aborted"));
      });

      xhr.open("PUT", uploadUrl);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.send(file);
    });
  } catch (error) {
    console.error("Upload to presigned URL failed:", error);
    throw new Error(error.message || "Failed to upload file to S3");
  }
};

/**
 * Confirm upload with backend after successful S3 upload
 * @param {string} fileName - The filename
 * @param {string} fileUrl - The public file URL from S3
 * @returns {Promise<Object>} Confirmation response
 */
export const confirmUpload = async (fileName, fileUrl) => {
  try {
    if (!fileName || !fileUrl) {
      throw new Error("fileName and fileUrl are required");
    }

    const token = await authStorage.getItem("token");
    const response = await fetch(`${getApiBaseUrl()}/media/confirm-upload`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        fileName,
        fileUrl,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Failed to confirm upload with status ${response.status}`);
    }

    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Confirm upload failed:", error);
    throw new Error(error.message || "Failed to confirm upload");
  }
};

/**
 * Delete a media file
 * @param {string} filename - The filename to delete
 * @returns {Promise<void>}
 */
export const deleteMedia = async (filename) => {
  try {
    const token = await authStorage.getItem("token");
    const response = await fetch(`${getApiBaseUrl()}/media/${filename}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Delete failed with status ${response.status}`);
    }
  } catch (error) {
    console.error("Media delete failed:", error);
    throw new Error(error.message || "Failed to delete file");
  }
};

export const mediaService = {
  uploadMedia,
  uploadMultipleMedia,
  requestUploadUrl,
  uploadToPresignedUrl,
  confirmUpload,
  deleteMedia,
};

export default mediaService;
