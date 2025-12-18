/**
 * Image upload error handling utility
 * Provides typed errors and user-friendly messages for image upload failures
 */

export type ImageUploadErrorType =
  | "FILE_TOO_LARGE"
  | "UNSUPPORTED_FILE_TYPE"
  | "FILE_READ_ERROR"
  | "NETWORK_ERROR"
  | "SUPABASE_ERROR"
  | "UNKNOWN_ERROR";

export interface ImageUploadError {
  type: ImageUploadErrorType;
  message: string;
  technical?: string; // For console logging only
}

// Constants
const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

/**
 * Validates file before reading
 */
export function validateImageFile(file: File): ImageUploadError | null {
  // Check file type
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      type: "UNSUPPORTED_FILE_TYPE",
      message: `Unsupported file type. Please use JPG, PNG, or WebP images only.`,
      technical: `File type: ${file.type}`,
    };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    return {
      type: "FILE_TOO_LARGE",
      message: `Image is too large (${sizeMB} MB). Maximum size is ${MAX_FILE_SIZE_MB} MB.`,
      technical: `File size: ${file.size} bytes`,
    };
  }

  return null;
}

/**
 * Reads file as data URL with error handling
 */
export function readImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    // Validate first
    const validationError = validateImageFile(file);
    if (validationError) {
      reject(validationError);
      return;
    }

    const reader = new FileReader();

    reader.onerror = () => {
      reject({
        type: "FILE_READ_ERROR",
        message: "Failed to read image file. Please try a different image.",
        technical: `FileReader error for file: ${file.name}`,
      } as ImageUploadError);
    };

    reader.onabort = () => {
      reject({
        type: "FILE_READ_ERROR",
        message: "Image upload was cancelled. Please try again.",
        technical: `FileReader aborted for file: ${file.name}`,
      } as ImageUploadError);
    };

    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string") {
        resolve(result);
      } else {
        reject({
          type: "FILE_READ_ERROR",
          message: "Failed to process image. Please try a different image.",
          technical: `FileReader result was not a string for file: ${file.name}`,
        } as ImageUploadError);
      }
    };

    try {
      reader.readAsDataURL(file);
    } catch (err: any) {
      reject({
        type: "FILE_READ_ERROR",
        message: "Failed to read image file. Please try a different image.",
        technical: `FileReader exception: ${err?.message || String(err)}`,
      } as ImageUploadError);
    }
  });
}

/**
 * Handles backend submission errors and converts to user-friendly messages
 */
export function handleBackendImageError(error: any): ImageUploadError {
  // Network errors
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return {
      type: "NETWORK_ERROR",
      message: "Network error. Please check your connection and try again.",
      technical: `Network error: ${error.message}`,
    };
  }

  // Timeout errors
  if (error?.name === "AbortError" || error?.message?.includes("timeout")) {
    return {
      type: "NETWORK_ERROR",
      message: "Upload timed out. Please try again.",
      technical: `Timeout error: ${error.message}`,
    };
  }

  // Backend validation errors
  if (error?.message) {
    const message = String(error.message).toLowerCase();

    // Image-related validation errors
    if (message.includes("image") || message.includes("images")) {
      if (message.includes("required") || message.includes("missing")) {
        return {
          type: "UNKNOWN_ERROR",
          message: "At least one image is required.",
          technical: `Backend validation: ${error.message}`,
        };
      }
      if (message.includes("size") || message.includes("large")) {
        return {
          type: "FILE_TOO_LARGE",
          message: "Image is too large. Please use images smaller than 5 MB.",
          technical: `Backend validation: ${error.message}`,
        };
      }
    }

    // Supabase-specific errors
    if (message.includes("supabase") || message.includes("storage") || message.includes("bucket")) {
      return {
        type: "SUPABASE_ERROR",
        message: "Image upload service error. Please try again in a moment.",
        technical: `Supabase error: ${error.message}`,
      };
    }

    // Generic backend error (fallback)
    return {
      type: "UNKNOWN_ERROR",
      message: error.message || "Failed to save image. Please try again.",
      technical: `Backend error: ${error.message}`,
    };
  }

  // Unknown error (final fallback)
  return {
    type: "UNKNOWN_ERROR",
    message: "An unexpected error occurred. Please try again.",
    technical: `Unknown error: ${String(error)}`,
  };
}

/**
 * Gets user-friendly error message for display
 */
export function getErrorMessage(error: ImageUploadError): string {
  return error.message;
}

