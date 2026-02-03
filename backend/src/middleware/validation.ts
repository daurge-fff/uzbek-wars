/**
 * Input validation middleware
 * 
 * Provides validation and sanitization for user inputs
 * to prevent injection attacks and ensure data integrity
 */

import { body, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Middleware to check validation results
 */
export const validate = (req: Request, res: Response, next: NextFunction): void => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Validation failed:', errors.array());
    res.status(400).json({
      error: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: errors.array()
    });
    return;
  }
  next();
};

/**
 * Validation rules for select-character endpoint
 */
export const validateSelectCharacter = [
  body('characterId')
    .trim()
    .notEmpty().withMessage('Character ID is required')
    .matches(/^char_[a-z]+$/).withMessage('Invalid character ID format')
    .isLength({ max: 50 }).withMessage('Character ID too long'),
  
  body('cityId')
    .trim()
    .notEmpty().withMessage('City ID is required')
    .matches(/^[a-z_]+$/).withMessage('Invalid city ID format')
    .isLength({ max: 50 }).withMessage('City ID too long'),
  
  body('displayName')
    .optional()
    .trim()
    .isLength({ min: 3, max: 20 }).withMessage('Display name must be 3-20 characters')
    .matches(/^[a-zA-Zа-яА-ЯёЁіІїЇєЄґҐ0-9\s-]+$/).withMessage('Display name contains invalid characters')
    .custom((value) => {
      // Проверка на только цифры
      if (/^\d+$/.test(value)) {
        throw new Error('Display name cannot be only numbers');
      }
      // Проверка на двойные пробелы
      if (/\s{2,}/.test(value)) {
        throw new Error('Display name cannot contain consecutive spaces');
      }
      return true;
    }),
  
  body('referralCode')
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage('Referral code too long')
    .matches(/^[A-Z0-9]+$/).withMessage('Invalid referral code format'),
  
  validate
];

/**
 * Validation rules for perform-activity endpoint
 */
export const validatePerformActivity = [
  body('activityId')
    .trim()
    .notEmpty().withMessage('Activity ID is required')
    .matches(/^[a-z_]+$/).withMessage('Invalid activity ID format')
    .isLength({ max: 50 }).withMessage('Activity ID too long'),
  
  validate
];

/**
 * Validation rules for language update
 */
export const validateLanguage = [
  body('language')
    .trim()
    .notEmpty().withMessage('Language is required')
    .isIn(['ru', 'uz', 'uk', 'en']).withMessage('Invalid language code'),
  
  validate
];

/**
 * Validation rules for cosmetic purchase
 */
export const validateCosmeticPurchase = [
  body('itemId')
    .trim()
    .notEmpty().withMessage('Item ID is required')
    .matches(/^[a-z_]+$/).withMessage('Invalid item ID format')
    .isLength({ max: 50 }).withMessage('Item ID too long'),
  
  body('currency')
    .trim()
    .notEmpty().withMessage('Currency is required')
    .isIn(['soms', 'crystals']).withMessage('Invalid currency type'),
  
  validate
];

/**
 * Validation rules for cosmetic equip/unequip
 */
export const validateCosmeticEquip = [
  body('itemId')
    .trim()
    .notEmpty().withMessage('Item ID is required')
    .matches(/^[a-z_]+$/).withMessage('Invalid item ID format')
    .isLength({ max: 50 }).withMessage('Item ID too long'),
  
  validate
];

/**
 * Validation rules for username check
 */
export const validateUsernameCheck = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 20 }).withMessage('Username must be 3-20 characters')
    .matches(/^[a-zA-Zа-яА-ЯёЁіІїЇєЄґҐ0-9\s-]+$/).withMessage('Username contains invalid characters'),
  
  validate
];

/**
 * Sanitize MongoDB query to prevent NoSQL injection
 */
export function sanitizeMongoQuery(query: any): any {
  if (typeof query !== 'object' || query === null) {
    return query;
  }

  const sanitized: any = {};
  
  for (const key in query) {
    // Skip prototype pollution
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }

    const value = query[key];

    // Remove MongoDB operators from user input
    if (typeof key === 'string' && key.startsWith('$')) {
      logger.warn(`Blocked MongoDB operator in query: ${key}`);
      continue;
    }

    // Recursively sanitize nested objects
    if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeMongoQuery(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Rate limiting helper - track requests per IP
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  ip: string,
  maxRequests: number = 100,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const record = requestCounts.get(ip);

  if (!record || now > record.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * Rate limiting middleware
 */
export function rateLimit(maxRequests: number = 100, windowMs: number = 60000) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    
    if (!checkRateLimit(ip, maxRequests, windowMs)) {
      logger.warn(`Rate limit exceeded for IP: ${ip}`);
      res.status(429).json({
        error: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Please try again later'
      });
      return;
    }

    next();
  };
}
