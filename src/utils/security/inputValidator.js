/**
 * Critical Security: Input Validation & Sanitization
 * Fixes SQL Injection and XSS vulnerabilities
 */

export const sanitizeSearchTerm = (input) => {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/[';\-]/g, '')  // Escape dash to avoid regex range error
    .replace(/--/g, '')       // Remove SQL comment syntax
    .replace(/(\bOR\b|\bAND\b|\bUNION\b|\bSELECT\b|\bDROP\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b)/gi, '')
    .trim()
    .substring(0, 100);
};

export const validateDate = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return null;
  const minDate = new Date('2000-01-01');
  const maxDate = new Date('2100-12-31');
  if (date < minDate || date > maxDate) return null;
  return date.toISOString().split('T')[0];
};

export const validateNumber = (value, min = 0, max = Number.MAX_SAFE_INTEGER) => {
  const num = Number(value);
  if (isNaN(num)) return min;
  if (num < min) return min;
  if (num > max) return max;
  return num;
};

export const validatePageSize = (size) => {
  const num = Number(size);
  if (isNaN(num) || num < 1) return 20;
  if (num > 10000) return 10000;
  return num;
};

export const sanitizeQueryParams = (params) => {
  const sanitized = {};
  if (params.searchTerm) sanitized.searchTerm = sanitizeSearchTerm(params.searchTerm);
  if (params.startDate) sanitized.startDate = validateDate(params.startDate);
  if (params.endDate) sanitized.endDate = validateDate(params.endDate);
  if (params.page) sanitized.page = validateNumber(params.page, 1, 10000);
  if (params.pageSize) sanitized.pageSize = validatePageSize(params.pageSize);
  return sanitized;
};

export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
};

export const validatePhone = (phone) => {
  if (!phone || typeof phone !== 'string') return false;
  const phoneRegex = /^[0-9]{10}$/;
  return phoneRegex.test(phone.replace(/[\s-]/g, ''));
};

export const sanitizeUserInput = (input) => {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
};