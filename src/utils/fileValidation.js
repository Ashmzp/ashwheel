/**
 * File Upload Validation Utilities
 * Fixes HIGH severity issues related to file uploads
 */

// Max file sizes (in bytes)
export const MAX_FILE_SIZES = {
  image: 5 * 1024 * 1024, // 5MB
  pdf: 10 * 1024 * 1024, // 10MB
  video: 100 * 1024 * 1024, // 100MB
  document: 10 * 1024 * 1024, // 10MB
};

// Allowed MIME types
export const ALLOWED_MIME_TYPES = {
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  pdf: ['application/pdf'],
  video: ['video/mp4', 'video/webm', 'video/ogg'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
};

// Validate file size
export const validateFileSize = (file, maxSize) => {
  if (!file) return { valid: false, error: 'No file provided' };
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size exceeds ${(maxSize / (1024 * 1024)).toFixed(2)}MB`,
    };
  }
  return { valid: true, error: null };
};

// Validate file type
export const validateFileType = (file, allowedTypes) => {
  if (!file) return { valid: false, error: 'No file provided' };
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed`,
    };
  }
  return { valid: true, error: null };
};

// Validate image file
export const validateImage = (file) => {
  const sizeValidation = validateFileSize(file, MAX_FILE_SIZES.image);
  if (!sizeValidation.valid) return sizeValidation;

  const typeValidation = validateFileType(file, ALLOWED_MIME_TYPES.image);
  if (!typeValidation.valid) return typeValidation;

  return { valid: true, error: null };
};

// Validate PDF file
export const validatePDF = (file) => {
  const sizeValidation = validateFileSize(file, MAX_FILE_SIZES.pdf);
  if (!sizeValidation.valid) return sizeValidation;

  const typeValidation = validateFileType(file, ALLOWED_MIME_TYPES.pdf);
  if (!typeValidation.valid) return typeValidation;

  return { valid: true, error: null };
};

// Validate video file
export const validateVideo = (file) => {
  const sizeValidation = validateFileSize(file, MAX_FILE_SIZES.video);
  if (!sizeValidation.valid) return sizeValidation;

  const typeValidation = validateFileType(file, ALLOWED_MIME_TYPES.video);
  if (!typeValidation.valid) return typeValidation;

  return { valid: true, error: null };
};

// Sanitize filename
export const sanitizeFilename = (filename) => {
  if (!filename) return 'unnamed';
  
  // Remove special characters and spaces
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase()
    .slice(0, 100); // Max 100 chars
};

// Get file extension
export const getFileExtension = (filename) => {
  if (!filename) return '';
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
};

// Check if file is image
export const isImage = (file) => {
  return file && ALLOWED_MIME_TYPES.image.includes(file.type);
};

// Check if file is PDF
export const isPDF = (file) => {
  return file && file.type === 'application/pdf';
};

// Check if file is video
export const isVideo = (file) => {
  return file && ALLOWED_MIME_TYPES.video.includes(file.type);
};

// Convert file to base64
export const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

// Compress image
export const compressImage = async (file, maxWidth = 1920, maxHeight = 1080, quality = 0.8) => {
  return new Promise((resolve, reject) => {
    if (!isImage(file)) {
      reject(new Error('File is not an image'));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }

        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            resolve(new File([blob], file.name, { type: file.type }));
          },
          file.type,
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
  });
};

// Validate multiple files
export const validateFiles = (files, validator) => {
  const results = [];
  
  for (const file of files) {
    const validation = validator(file);
    results.push({
      file,
      ...validation,
    });
  }

  const allValid = results.every(r => r.valid);
  const errors = results.filter(r => !r.valid).map(r => r.error);

  return {
    valid: allValid,
    errors,
    results,
  };
};

export default {
  MAX_FILE_SIZES,
  ALLOWED_MIME_TYPES,
  validateFileSize,
  validateFileType,
  validateImage,
  validatePDF,
  validateVideo,
  sanitizeFilename,
  getFileExtension,
  isImage,
  isPDF,
  isVideo,
  fileToBase64,
  compressImage,
  validateFiles,
};
