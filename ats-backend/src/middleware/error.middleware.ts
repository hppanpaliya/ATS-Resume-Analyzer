/**
 * Global Error Handler Middleware
 * Catches and processes all errors in a consistent manner
 */

import { Request, Response, NextFunction } from 'express';
import { AppError, isOperationalError, HttpStatusCode } from '../utils/errors';
import { Logger } from '../utils/logger';

/**
 * Error handler middleware
 * Must be registered LAST in the middleware chain
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  // Don't handle if headers already sent
  if (res.headersSent) {
    return;
  }

  const requestId = (req as any).id;
  const userId = (req as any).userId;

  // Log the error
  if (err instanceof AppError) {
    Logger.error(
      `Request failed: ${err.message}`,
      err,
      {
        requestId,
        userId,
        endpoint: `${req.method} ${req.path}`,
        statusCode: err.statusCode,
        code: err.code,
      }
    );
  } else {
    Logger.error(
      'Unexpected error occurred',
      err,
      {
        requestId,
        userId,
        endpoint: `${req.method} ${req.path}`,
      }
    );
  }

  // Handle AppError instances
  if (err instanceof AppError) {
    const statusCode = err.statusCode;
    const response = {
      success: false,
      error: {
        code: err.code,
        message: err.getClientMessage(),
        timestamp: err.timestamp.toISOString(),
        ...(requestId && { requestId }),
        // Only include context in development
        ...(process.env.NODE_ENV === 'development' && 
          Object.keys(err.context).length > 0 && 
          { context: err.context }
        ),
      },
    };

    // Add retry-after header for rate limit errors
    if (err.code === 'TOO_MANY_REQUESTS' && 'retryAfter' in err) {
      res.set('Retry-After', String((err as any).retryAfter));
    }

    return res.status(statusCode).json(response);
  }

  // Handle unknown errors (operational flag not checked means internal error)
  const unknownError = err as Error;
  const statusCode = HttpStatusCode.INTERNAL_SERVER_ERROR;
  
  const response = {
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred. Please try again later.',
      timestamp: new Date().toISOString(),
      ...(requestId && { requestId }),
      // Only include details in development
      ...(process.env.NODE_ENV === 'development' && {
        details: unknownError.message,
        stack: unknownError.stack?.split('\n').slice(0, 10),
      }),
    },
  };

  return res.status(statusCode).json(response);
};

/**
 * Async wrapper to catch promise rejections in route handlers
 * Usage: router.get('/path', asyncHandler(async (req, res) => { ... }))
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Not found handler
 * Should be registered after all routes
 */
export const notFoundHandler = (_req: Request, res: Response) => {
  const response = {
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Resource not found',
      timestamp: new Date().toISOString(),
    },
  };

  return res.status(HttpStatusCode.NOT_FOUND).json(response);
};
