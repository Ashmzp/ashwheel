/**
 * Form Validation Utilities
 * Fixes HIGH severity issues related to input validation
 */

// Email validation
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
};

// Phone validation (Indian format)
export const isValidPhone = (phone) => {
  if (!phone) return false;
  const cleaned = phone.toString().replace(/\D/g, '');
  return cleaned.length === 10; // Only 10 digits for Indian numbers
};

// GST validation
export const isValidGST = (gst) => {
  if (!gst || typeof gst !== 'string') return false;
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstRegex.test(gst.trim().toUpperCase());
};

// PAN validation
export const isValidPAN = (pan) => {
  if (!pan || typeof pan !== 'string') return false;
  const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
  return panRegex.test(pan.trim().toUpperCase());
};

// Aadhaar validation
export const isValidAadhaar = (aadhaar) => {
  if (!aadhaar) return false;
  const cleaned = aadhaar.toString().replace(/\D/g, '');
  return cleaned.length === 12;
};

// PIN code validation
export const isValidPinCode = (pinCode) => {
  if (!pinCode) return false;
  const cleaned = pinCode.toString().replace(/\D/g, '');
  return cleaned.length === 6;
};

// Number validation
export const isValidNumber = (value, min = -Infinity, max = Infinity) => {
  const num = parseFloat(value);
  return !isNaN(num) && num >= min && num <= max;
};

// Integer validation
export const isValidInteger = (value, min = -Infinity, max = Infinity) => {
  const num = parseInt(value, 10);
  return !isNaN(num) && num >= min && num <= max && Number.isInteger(num);
};

// Date validation
export const isValidDate = (dateString) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date);
};

// URL validation
export const isValidURL = (url) => {
  if (!url || typeof url !== 'string') return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// String length validation
export const isValidLength = (str, min = 0, max = Infinity) => {
  if (typeof str !== 'string') return false;
  const length = str.trim().length;
  return length >= min && length <= max;
};

// Required field validation
export const isRequired = (value) => {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim() !== '';
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
};

// Alphanumeric validation
export const isAlphanumeric = (str) => {
  if (!str || typeof str !== 'string') return false;
  return /^[a-zA-Z0-9]+$/.test(str);
};

// Alphabetic validation
export const isAlphabetic = (str) => {
  if (!str || typeof str !== 'string') return false;
  return /^[a-zA-Z\s]+$/.test(str);
};

// Numeric validation
export const isNumeric = (str) => {
  if (!str) return false;
  return /^[0-9]+$/.test(str.toString());
};

// Password strength validation
export const isStrongPassword = (password) => {
  if (!password || typeof password !== 'string') return false;
  // At least 8 chars, max 64, 1 uppercase, 1 lowercase, 1 number, 1 special char
  return password.length >= 8 &&
         password.length <= 64 &&
         /[A-Z]/.test(password) &&
         /[a-z]/.test(password) &&
         /[0-9]/.test(password) &&
         /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
};

// Sanitize string input
export const sanitizeString = (str, maxLength = 1000) => {
  if (!str || typeof str !== 'string') return '';
  return str.trim().slice(0, maxLength);
};

// Sanitize number input
export const sanitizeNumber = (value, min = -Infinity, max = Infinity, defaultValue = 0) => {
  const num = parseFloat(value);
  if (isNaN(num)) return defaultValue;
  return Math.min(Math.max(num, min), max);
};

// Validate form data
export const validateForm = (data, rules) => {
  const errors = {};
  
  for (const [field, fieldRules] of Object.entries(rules)) {
    const value = data[field];
    
    if (fieldRules.required && !isRequired(value)) {
      errors[field] = `${field} is required`;
      continue;
    }
    
    if (value && fieldRules.email && !isValidEmail(value)) {
      errors[field] = 'Invalid email format';
    }
    
    if (value && fieldRules.phone && !isValidPhone(value)) {
      errors[field] = 'Invalid phone number';
    }
    
    if (value && fieldRules.gst && !isValidGST(value)) {
      errors[field] = 'Invalid GST number';
    }
    
    if (value && fieldRules.pan && !isValidPAN(value)) {
      errors[field] = 'Invalid PAN number';
    }
    
    if (value && fieldRules.minLength && !isValidLength(value, fieldRules.minLength)) {
      errors[field] = `Minimum length is ${fieldRules.minLength}`;
    }
    
    if (value && fieldRules.maxLength && !isValidLength(value, 0, fieldRules.maxLength)) {
      errors[field] = `Maximum length is ${fieldRules.maxLength}`;
    }
    
    if (value !== undefined && fieldRules.min !== undefined && !isValidNumber(value, fieldRules.min)) {
      errors[field] = `Minimum value is ${fieldRules.min}`;
    }
    
    if (value !== undefined && fieldRules.max !== undefined && !isValidNumber(value, -Infinity, fieldRules.max)) {
      errors[field] = `Maximum value is ${fieldRules.max}`;
    }
    
    if (value && fieldRules.custom && !fieldRules.custom(value)) {
      errors[field] = fieldRules.customMessage || 'Invalid value';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export default {
  isValidEmail,
  isValidPhone,
  isValidGST,
  isValidPAN,
  isValidAadhaar,
  isValidPinCode,
  isValidNumber,
  isValidInteger,
  isValidDate,
  isValidURL,
  isValidLength,
  isRequired,
  isAlphanumeric,
  isAlphabetic,
  isNumeric,
  isStrongPassword,
  sanitizeString,
  sanitizeNumber,
  validateForm,
};
