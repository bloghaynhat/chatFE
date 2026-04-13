import React, { useState } from "react";
import { FileUploader, ImageUploader } from "../common";

/**
 * FileUploadDemo Component
 * Demonstrates how to use FileUploader and ImageUploader components
 * for uploading files to S3 via presigned URLs
 */
export const FileUploadDemo = () => {
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploadedImage, setUploadedImage] = useState(null);

  const handleFileUploadSuccess = (fileData) => {
    if (Array.isArray(fileData)) {
      setUploadedFiles((prev) => [...prev, ...fileData]);
    } else {
      setUploadedFiles((prev) => [...prev, fileData]);
    }
  };

  const handleFileUploadError = (error) => {
    console.error("File upload error:", error);
    alert(`Upload failed: ${error.message}`);
  };

  const handleImageUploadSuccess = (imageData) => {
    setUploadedImage(imageData);
  };

  const handleImageUploadError = (error) => {
    console.error("Image upload error:", error);
    alert(`Image upload failed: ${error.message}`);
  };

  const handleRemoveFile = (index) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">File Upload Demo</h2>

      {/* Image Uploader Section */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Upload Image</h3>
        <ImageUploader
          onUploadSuccess={handleImageUploadSuccess}
          onUploadError={handleImageUploadError}
          className="mb-4"
        />

        {uploadedImage && (
          <div className="mt-4 p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-800 font-medium">✓ Image uploaded successfully!</p>
            <p className="text-sm text-gray-600 mt-2">
              <strong>File:</strong> {uploadedImage.fileName}
            </p>
            <p className="text-sm text-gray-600">
              <strong>URL:</strong>{" "}
              <a
                href={uploadedImage.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline break-all"
              >
                {uploadedImage.fileUrl}
              </a>
            </p>
          </div>
        )}
      </div>

      {/* File Uploader Section */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Upload Files</h3>
        <FileUploader
          onUploadSuccess={handleFileUploadSuccess}
          onUploadError={handleFileUploadError}
          multiple={true}
          accept="*/*"
          className="mb-4"
        />

        {uploadedFiles.length > 0 && (
          <div className="mt-4">
            <h4 className="font-semibold mb-3">Uploaded Files:</h4>
            <div className="space-y-3">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="p-3 bg-green-50 rounded-lg flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm text-green-800 font-medium">✓ {file.fileName}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      <strong>Size:</strong> {(file.size / 1024).toFixed(2)} KB
                    </p>
                    <p className="text-xs text-gray-600">
                      <strong>Type:</strong> {file.mimetype}
                    </p>
                    <p className="text-xs text-gray-600 mt-2">
                      <strong>URL:</strong>{" "}
                      <a
                        href={file.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline break-all"
                      >
                        {file.fileUrl}
                      </a>
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveFile(index)}
                    className="ml-4 px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Usage Instructions */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-semibold text-blue-900 mb-2">📝 How it works:</h4>
        <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
          <li>Select a file or image to upload</li>
          <li>Component requests presigned URL from backend</li>
          <li>File is uploaded directly to S3 (not through backend)</li>
          <li>Upload is confirmed with backend</li>
          <li>File URL is returned and displayed</li>
        </ol>
      </div>
    </div>
  );
};

export default FileUploadDemo;
