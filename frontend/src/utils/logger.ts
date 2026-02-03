/**
 * Production-safe logger
 * Only logs in development mode
 */

const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args: any[]) => {
    if (isDev) console.log(...args);
  },
  
  error: (...args: any[]) => {
    console.error(...args); // Always log errors
  },
  
  warn: (...args: any[]) => {
    if (isDev) console.warn(...args);
  },
  
  info: (...args: any[]) => {
    if (isDev) console.info(...args);
  },
};
