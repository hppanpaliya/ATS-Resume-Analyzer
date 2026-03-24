/**
 * Structured Logging Utility
 * Provides JSON-formatted logging with context tracking
 */

import { AppError } from './errors';

/**
 * Log Levels
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

/**
 * Request Context for tracking across async operations
 */
export interface RequestContext {
  requestId: string;
  userId?: string;
  ip?: string;
  method?: string;
  path?: string;
  userAgent?: string;
}

/**
 * Structured Log Entry
 */
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: RequestContext;
  metadata?: Record<string, any>;
  error?: {
    code?: string;
    message?: string;
    stack?: string;
    statusCode?: number;
  };
}

/**
 * Logger Class
 * Handles structured logging with context tracking
 */
export class Logger {
  private static contextStack: RequestContext[] = [];
  private static isDevelopment = process.env.NODE_ENV !== 'production';

  /**
   * Push request context onto the stack
   */
  static pushContext(context: RequestContext): void {
    Logger.contextStack.push(context);
  }

  /**
   * Pop request context from the stack
   */
  static popContext(): void {
    Logger.contextStack.pop();
  }

  /**
   * Get current request context
   */
  static getCurrentContext(): RequestContext | undefined {
    return Logger.contextStack[Logger.contextStack.length - 1];
  }

  /**
   * Log at DEBUG level
   */
  static debug(message: string, metadata?: Record<string, any>): void {
    Logger.log(LogLevel.DEBUG, message, metadata);
  }

  /**
   * Log at INFO level
   */
  static info(message: string, metadata?: Record<string, any>): void {
    Logger.log(LogLevel.INFO, message, metadata);
  }

  /**
   * Log at WARN level
   */
  static warn(message: string, metadata?: Record<string, any>): void {
    Logger.log(LogLevel.WARN, message, metadata);
  }

  /**
   * Log at ERROR level
   */
  static error(message: string, error?: Error | AppError, metadata?: Record<string, any>): void {
    Logger.logError(message, error, metadata);
  }

  /**
   * Generic log method
   */
  private static log(
    level: LogLevel,
    message: string,
    metadata?: Record<string, any>
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: Logger.getCurrentContext(),
      ...(metadata && { metadata }),
    };

    Logger.output(entry);
  }

  /**
   * Error logging with stack trace
   */
  private static logError(
    message: string,
    error?: Error | AppError,
    metadata?: Record<string, any>
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel.ERROR,
      message,
      context: Logger.getCurrentContext(),
      ...(metadata && { metadata }),
    };

    // Add error details
    if (error) {
      entry.error = {
        message: error.message,
        stack: error.stack,
      };

      // Add AppError specific details
      if (error instanceof AppError) {
        entry.error.code = error.code;
        entry.error.statusCode = error.statusCode;
        if (Object.keys(error.context).length > 0) {
          entry.metadata = { ...entry.metadata, errorContext: error.context };
        }
      }
    }

    Logger.output(entry);
  }

  /**
   * Output log entry
   * In production, uses JSON format
   * In development, uses pretty-printed format
   */
  private static output(entry: LogEntry): void {
    const timestamp = new Date().toISOString();

    if (Logger.isDevelopment) {
      // Pretty-print in development
      const levelColors = {
        [LogLevel.DEBUG]: '\x1b[36m', // Cyan
        [LogLevel.INFO]: '\x1b[32m', // Green
        [LogLevel.WARN]: '\x1b[33m', // Yellow
        [LogLevel.ERROR]: '\x1b[31m', // Red
      };
      const reset = '\x1b[0m';
      const color = levelColors[entry.level];

      let output = `${color}[${timestamp}] ${entry.level}${reset} ${entry.message}`;

      if (entry.error) {
        output += `\n  Error: ${entry.error.message}`;
        if (entry.error.code) output += ` (${entry.error.code})`;
        if (entry.error.statusCode) output += ` [${entry.error.statusCode}]`;
        if (entry.error.stack) {
          output += `\n  Stack: ${entry.error.stack.split('\n').slice(0, 5).join('\n  ')}`;
        }
      }

      if (entry.context) {
        output += `\n  Context: ${JSON.stringify(entry.context)}`;
      }

      if (entry.metadata) {
        output += `\n  Metadata: ${JSON.stringify(entry.metadata, null, 2)}`;
      }

      console.log(output);
    } else {
      // JSON format in production
      const jsonEntry = JSON.stringify(entry);
      console.log(jsonEntry);
    }
  }

  /**
   * Create a child logger with additional context
   */
  static createChild(additionalContext: Partial<RequestContext>) {
    const currentContext = Logger.getCurrentContext();
    const newContext = { ...currentContext, ...additionalContext } as RequestContext;

    return {
      debug: (message: string, metadata?: Record<string, any>) => {
        Logger.pushContext(newContext);
        Logger.debug(message, metadata);
        Logger.popContext();
      },
      info: (message: string, metadata?: Record<string, any>) => {
        Logger.pushContext(newContext);
        Logger.info(message, metadata);
        Logger.popContext();
      },
      warn: (message: string, metadata?: Record<string, any>) => {
        Logger.pushContext(newContext);
        Logger.warn(message, metadata);
        Logger.popContext();
      },
      error: (message: string, error?: Error | AppError, metadata?: Record<string, any>) => {
        Logger.pushContext(newContext);
        Logger.error(message, error, metadata);
        Logger.popContext();
      },
    };
  }
}

/**
 * Create a request-scoped logger context
 * Used in middleware to track requests
 */
export function createRequestContext(req: any): RequestContext {
  return {
    requestId: req.id || crypto.randomUUID(),
    userId: req.userId,
    ip: req.ip || req.connection.remoteAddress,
    method: req.method,
    path: req.path,
    userAgent: req.get('user-agent'),
  };
}
