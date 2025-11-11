/**
 * CSRF Protection Utility
 * Generate and validate CSRF tokens
 */

const CSRF_TOKEN_KEY = 'ashwheel_csrf_token';

/**
 * Generate a random CSRF token
 * @returns {string} - CSRF token
 */
export const generateCSRFToken = () => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Get or create CSRF token
 * @returns {string} - CSRF token
 */
export const getCSRFToken = () => {
  let token = sessionStorage.getItem(CSRF_TOKEN_KEY);
  
  if (!token) {
    token = generateCSRFToken();
    sessionStorage.setItem(CSRF_TOKEN_KEY, token);
  }
  
  return token;
};

/**
 * Validate CSRF token
 * @param {string} token - Token to validate
 * @returns {boolean} - Is valid
 */
export const validateCSRFToken = (token) => {
  const storedToken = sessionStorage.getItem(CSRF_TOKEN_KEY);
  return token === storedToken;
};

/**
 * Add CSRF token to form data
 * @param {FormData} formData - Form data object
 * @returns {FormData} - Form data with CSRF token
 */
export const addCSRFToFormData = (formData) => {
  formData.append('csrf_token', getCSRFToken());
  return formData;
};

/**
 * Add CSRF token to headers
 * @param {Object} headers - Request headers
 * @returns {Object} - Headers with CSRF token
 */
export const addCSRFToHeaders = (headers = {}) => {
  return {
    ...headers,
    'X-CSRF-Token': getCSRFToken(),
  };
};
