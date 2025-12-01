/**
 * Security Utility Functions
 * Sanitize user input to prevent XSS attacks
 */

/**
 * Sanitize HTML string to prevent XSS
 * @param {string} html - Raw HTML string
 * @returns {string} - Sanitized HTML
 */
export const sanitizeHTML = (html) => {
  if (!html) return '';
  
  const div = document.createElement('div');
  div.textContent = html;
  return div.textContent; // Use textContent instead of innerHTML for security
};

/**
 * Escape special characters in string
 * @param {string} str - Input string
 * @returns {string} - Escaped string
 */
export const escapeHTML = (str) => {
  if (!str) return '';
  
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return String(str).replace(/[&<>"'/]/g, (char) => map[char]);
};

/**
 * Validate and sanitize URL
 * @param {string} url - Input URL
 * @returns {string|null} - Valid URL or null
 */
export const sanitizeURL = (url) => {
  if (!url) return null;
  
  try {
    const parsed = new URL(url);
    // Only allow http and https protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
    return parsed.href;
  } catch {
    return null;
  }
};

/**
 * Validate file path (prevent path traversal)
 * @param {string} path - File path
 * @returns {boolean} - Is valid path
 */
export const isValidPath = (path) => {
  if (!path) return false;
  
  // Check for path traversal attempts
  const dangerous = ['../', '..\\', '%2e%2e', '%252e'];
  return !dangerous.some(pattern => path.toLowerCase().includes(pattern));
};

/**
 * Sanitize filename
 * @param {string} filename - Input filename
 * @returns {string} - Safe filename
 */
export const sanitizeFilename = (filename) => {
  if (!filename) return 'file';
  
  // Remove path separators and dangerous characters
  return filename
    .replace(/[/\\?%*:|"<>]/g, '-')
    .replace(/\.{2,}/g, '.')
    .substring(0, 255);
};
