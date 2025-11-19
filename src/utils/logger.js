/**
 * Production-safe logger utility
 * Prevents console exposure in production
 */

const isDev = import.meta.env.DEV;
const isProd = import.meta.env.PROD;

// Sanitize sensitive data from logs
const sanitizeData = (data) => {
  if (!data) return data;
  
  const sensitiveKeys = [
    'password', 'token', 'secret', 'key', 'apikey', 
    'authorization', 'cookie', 'session', 'access_token',
    'refresh_token', 'bearer', 'credential'
  ];
  
  if (typeof data === 'object') {
    const sanitized = Array.isArray(data) ? [...data] : { ...data };
    
    Object.keys(sanitized).forEach(key => {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof sanitized[key] === 'object') {
        sanitized[key] = sanitizeData(sanitized[key]);
      }
    });
    
    return sanitized;
  }
  
  return data;
};

// Format log message
const formatMessage = (level, context, ...args) => {
  const timestamp = new Date().toISOString();
  const sanitizedArgs = args.map(arg => sanitizeData(arg));
  
  return {
    timestamp,
    level,
    context,
    message: sanitizedArgs,
  };
};

// Logger class
class Logger {
  constructor() {
    this.logs = [];
    this.maxLogs = 100;
  }

  log(context, ...args) {
    if (isDev) {
      console.log(`[${context}]`, ...args);
    }
    this.storeLogs('log', context, ...args);
  }

  error(context, ...args) {
    if (isDev) {
      console.error(`[${context}]`, ...args);
    } else {
      // In production, only log to internal storage
      this.storeLogs('error', context, ...args);
    }
  }

  warn(context, ...args) {
    if (isDev) {
      console.warn(`[${context}]`, ...args);
    }
    this.storeLogs('warn', context, ...args);
  }

  info(context, ...args) {
    if (isDev) {
      console.info(`[${context}]`, ...args);
    }
    this.storeLogs('info', context, ...args);
  }

  debug(context, ...args) {
    if (isDev) {
      console.debug(`[${context}]`, ...args);
    }
  }

  storeLogs(level, context, ...args) {
    const logEntry = formatMessage(level, context, ...args);
    this.logs.push(logEntry);
    
    // Keep only last N logs
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  getLogs(level = null) {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return this.logs;
  }

  clearLogs() {
    this.logs = [];
  }

  // Export logs for debugging
  exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  }
}

// Create singleton instance
const logger = new Logger();

// Export logger methods
export const log = (context, ...args) => logger.log(context, ...args);
export const error = (context, ...args) => logger.error(context, ...args);
export const warn = (context, ...args) => logger.warn(context, ...args);
export const info = (context, ...args) => logger.info(context, ...args);
export const debug = (context, ...args) => logger.debug(context, ...args);
export const getLogs = (level) => logger.getLogs(level);
export const clearLogs = () => logger.clearLogs();
export const exportLogs = () => logger.exportLogs();

export default logger;
