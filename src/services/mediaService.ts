import { getApiBaseUrl } from "../runtime/config";
import { authStorage } from "../runtime/storage";
import { api } from "./api";

const readJsonSafely = async (response) => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
};

const unwrapResponseData = (payload) => {
  if (!payload || typeof payload !== "object") return payload;
  return payload.data || payload;
};

/**
 * Request a presigned upload URL
 * @param {string} filename - The original filename
 * @param {string} mimeType - The MIME type of the file
 * @param {number} size - The file size in bytes
 * @returns {Promise<Object>} Response data containing: uploadUrl, key, fileId
 */
export const requestUploadUrl = async (filename, mimeType, size) => {
  try {
    if (!filename || !mimeType || !size) {
      throw new Error("Filename, mimeType, and size are required");
    }

    let fileType = "DOCUMENT";
    if (mimeType.startsWith("image/")) fileType = "IMAGE";
    else if (mimeType.startsWith("video/")) fileType = "VIDEO";
    else if (mimeType.startsWith("audio/")) fileType = "AUDIO";

    const response = await api.post("/media/request-upload-url", {
      fileType, // from MediaFileType enum
      mimeType: mimeType, // required
      fileSize: size, // required
      originalName: filename, // optional
    });

    return response;
  } catch (error) {
    console.error("Request upload URL failed:", error);
    throw new Error(error.message || "Failed to request upload URL");
  }
};

/**
 * Upload file to presigned URL
 * @param {string} uploadUrl - The presigned URL from requestUploadUrl
 * @param {File} file - The file to upload
 * @returns {Promise<void>}
 */
export const uploadToPresignedUrl = async (uploadUrl, file) => {
  try {
    if (!uploadUrl || !file) {
      throw new Error("Upload URL and file are required");
    }

    const response = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "Content-Type": file.type || "application/octet-stream",
      },
      mode: "cors", // Thêm mode "cors"
      body: file,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(
        `Upload to presigned URL failed: ${response.status} - ${errorText}`,
      );
    }

    return response;
  } catch (error) {
    console.error("Upload to presigned URL failed:", error);
    throw error; // Quăng ngược lỗi nguyên gốc ra ngoài để báo chi tiết
  }
};

/**
 * Confirm presigned upload
 * @param {string} fileId - The fileId from requestUploadUrl response
 * @param {string} uploadedUrl - The URL of the uploaded file on S3 (without query params)
 * @returns {Promise<Object>} Response data containing: filename, url, originalName, size, mimetype
 */
export const confirmUpload = async (fileId, uploadedUrl) => {
  try {
    if (!fileId) {
      throw new Error("FileId is required");
    }

    const response = await api.post("/media/confirm-upload", {
      fileId,
      uploadedUrl,
    });

    return response;
  } catch (error) {
    console.error(
      "Confirm upload failed:",
      error,
      error.payload,
      error.details,
    );
    throw error;
  }
};

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
      const errorData = await readJsonSafely(response);
      throw new Error(
        errorData?.message ||
          errorData?.msg ||
          errorData?.rootCause ||
          `Upload failed with status ${response.status}`,
      );
    }

    const data = await readJsonSafely(response);
    return unwrapResponseData(data);
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
      if (file) {
        formData.append("files", file);
      }
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
      const errorData = await readJsonSafely(response);
      throw new Error(
        errorData?.message ||
          errorData?.msg ||
          errorData?.rootCause ||
          `Upload failed with status ${response.status}`,
      );
    }

    const data = await readJsonSafely(response);
    return unwrapResponseData(data);
  } catch (error) {
    console.error("Media upload failed:", error);
    throw new Error(error.message || "Failed to upload files");
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
      const errorData = await readJsonSafely(response);
      throw new Error(
        errorData?.message ||
          errorData?.msg ||
          errorData?.rootCause ||
          `Delete failed with status ${response.status}`,
      );
    }
  } catch (error) {
    console.error("Media delete failed:", error);
    throw new Error(error.message || "Failed to delete file");
  }
};

export const mediaService = {
  uploadMedia,
  uploadMultipleMedia,
  deleteMedia,
  requestUploadUrl,
  uploadToPresignedUrl,
  confirmUpload,
};

export default mediaService;
