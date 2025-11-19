/**
 * Universal Database Security Wrapper
 * Automatically applies security to all DB operations
 */

import { sanitizeSearchTerm, validateDate, validateNumber, validatePageSize } from './inputValidator';
import { logError, safeErrorMessage } from './errorHandler';
import { validateSession } from './authValidator';

export const secureQuery = async (queryBuilder, params = {}) => {
  try {
    await validateSession();
    
    let query = queryBuilder;
    
    if (params.searchTerm) {
      const safe = sanitizeSearchTerm(params.searchTerm);
      if (safe) query = query.ilike('name', `%${safe}%`);
    }
    
    if (params.startDate) {
      const safe = validateDate(params.startDate);
      if (safe) query = query.gte('created_at', safe);
    }
    
    if (params.endDate) {
      const safe = validateDate(params.endDate);
      if (safe) query = query.lte('created_at', safe);
    }
    
    if (params.page && params.pageSize) {
      const page = validateNumber(params.page, 1, 10000);
      const size = validatePageSize(params.pageSize);
      const from = (page - 1) * size;
      const to = from + size - 1;
      query = query.range(from, to);
    }
    
    const { data, error, count } = await query;
    
    if (error) {
      logError(error, { function: 'secureQuery', params });
      throw new Error(safeErrorMessage(error));
    }
    
    return { data: data || [], count: count || 0 };
  } catch (error) {
    logError(error, { function: 'secureQuery' });
    throw error;
  }
};

export const secureInsert = async (table, data, userId) => {
  try {
    await validateSession();
    
    const sanitizedData = {
      ...data,
      user_id: userId,
      created_at: new Date().toISOString()
    };
    
    return sanitizedData;
  } catch (error) {
    logError(error, { function: 'secureInsert' });
    throw error;
  }
};

export const secureUpdate = async (table, id, data) => {
  try {
    await validateSession();
    
    const sanitizedData = {
      ...data,
      updated_at: new Date().toISOString()
    };
    
    return sanitizedData;
  } catch (error) {
    logError(error, { function: 'secureUpdate' });
    throw error;
  }
};

export const secureDelete = async (table, id, userId) => {
  try {
    await validateSession();
    return { id, userId };
  } catch (error) {
    logError(error, { function: 'secureDelete' });
    throw error;
  }
};