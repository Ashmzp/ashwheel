/**
 * Batch Security Fix Utility
 * Apply security fixes to all database files
 */

import { sanitizeQueryParams } from './inputValidator';
import { logError } from './errorHandler';
import { validateSession } from './authValidator';

export const secureDbQuery = async (queryFn, params = {}, context = {}) => {
  try {
    await validateSession();
    const sanitized = sanitizeQueryParams(params);
    const result = await queryFn(sanitized);
    return result;
  } catch (error) {
    logError(error, { ...context, params });
    throw new Error('Database operation failed');
  }
};

export const withSecurity = (dbFunction) => {
  return async (...args) => {
    try {
      await validateSession();
      return await dbFunction(...args);
    } catch (error) {
      logError(error, { function: dbFunction.name, args });
      throw error;
    }
  };
};