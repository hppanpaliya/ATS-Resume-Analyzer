/**
 * Request Context Middleware
 * Adds request ID and sets up logging context
 */

import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { Logger, createRequestContext } from '../utils/logger';

/**
 * Attach request ID and create logging context
 */
export const requestContextMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  // Add request ID
  const requestId = (req.headers['x-request-id'] as string) || randomUUID();
  (req as any).id = requestId;

  // Create and push context
  const context = createRequestContext(req);
  Logger.pushContext(context);

  // Log incoming request
  Logger.debug(`Incoming request: ${req.method} ${req.path}`, {
    requestId,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  });

  next();
};
