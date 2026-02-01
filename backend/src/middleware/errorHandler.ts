import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

export class ValidationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class DatabaseError extends Error {
  constructor(message: string, public originalError: Error) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error('Error occurred:', {
    name: err.name,
    message: err.message,
    stack: err.stack
  });
  
  if (err instanceof ValidationError) {
    res.status(400).json({
      error: err.message,
      code: err.code
    });
    return;
  }
  
  if (err instanceof AuthenticationError) {
    res.status(401).json({
      error: err.message
    });
    return;
  }
  
  if (err instanceof NotFoundError) {
    res.status(404).json({
      error: err.message
    });
    return;
  }
  
  if (err instanceof DatabaseError) {
    res.status(500).json({
      error: 'Database operation failed',
      message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
    return;
  }
  
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
};

export default errorHandler;
