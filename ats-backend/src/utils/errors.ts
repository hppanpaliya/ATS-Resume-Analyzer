/**
 * Comprehensive Error Handling System
 * Provides error hierarchy, structured logging, and consistent error responses
 */

/**
 * HTTP Status Codes
 */
export enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
}

/**
 * Error Codes for structured error identification
 */
export enum ErrorCode {
  // Validation Errors (4xxx)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_FIELD = 'MISSING_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',

  // Authentication Errors (401x)
  AUTHENTICATION_REQUIRED = 'AUTHENTICATION_REQUIRED',
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  SESSION_EXPIRED = 'SESSION_EXPIRED',

  // Authorization Errors (403x)
  FORBIDDEN = 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  RESOURCE_ACCESS_DENIED = 'RESOURCE_ACCESS_DENIED',

  // Not Found Errors (404x)
  NOT_FOUND = 'NOT_FOUND',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  RESUME_NOT_FOUND = 'RESUME_NOT_FOUND',
  ANALYSIS_NOT_FOUND = 'ANALYSIS_NOT_FOUND',
  TEMPLATE_NOT_FOUND = 'TEMPLATE_NOT_FOUND',

  // Conflict Errors (409x)
  CONFLICT = 'CONFLICT',
  DUPLICATE_RESOURCE = 'DUPLICATE_RESOURCE',
  USER_ALREADY_EXISTS = 'USER_ALREADY_EXISTS',
  EMAIL_ALREADY_IN_USE = 'EMAIL_ALREADY_IN_USE',

  // Rate Limiting (429x)
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',

  // File Errors (422x)
  FILE_UPLOAD_ERROR = 'FILE_UPLOAD_ERROR',
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_SIZE_EXCEEDED = 'FILE_SIZE_EXCEEDED',
  FILE_PROCESSING_ERROR = 'FILE_PROCESSING_ERROR',

  // External Service Errors (502-504)
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  FILE_STORAGE_ERROR = 'FILE_STORAGE_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  GATEWAY_TIMEOUT = 'GATEWAY_TIMEOUT',

  // Internal Errors (5xxx)
  INTERNAL_SERVER_ERROR = 'INTERNAL_SERVER_ERROR',
  UNEXPECTED_ERROR = 'UNEXPECTED_ERROR',
  NOT_IMPLEMENTED = 'NOT_IMPLEMENTED',
}

/**
 * Base Application Error Class
 * All custom errors should extend this class
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: HttpStatusCode;
  public readonly isOperational: boolean;
  public readonly context: Record<string, any>;
  public readonly timestamp: Date;

  constructor(
    message: string,
    code: ErrorCode,
    statusCode: HttpStatusCode,
    context: Record<string, any> = {},
    isOperational: boolean = true
  ) {
    super(message);

    // Set prototype chain for instanceof checks
    Object.setPrototypeOf(this, AppError.prototype);

    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;
    this.timestamp = new Date();
    this.name = this.constructor.name;

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convert error to JSON for API responses
   */
  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        statusCode: this.statusCode,
        timestamp: this.timestamp.toISOString(),
        ...(Object.keys(this.context).length > 0 && { context: this.context }),
      },
    };
  }

  /**
   * Get safe error message for client (hide sensitive info)
   */
  getClientMessage(): string {
    if (this.isOperational) {
      return this.message;
    }
    return 'An unexpected error occurred. Please try again later.';
  }
}

/**
 * Validation Error
 * Used when input validation fails
 */
export class ValidationError extends AppError {
  constructor(message: string, context: Record<string, any> = {}) {
    super(
      message,
      ErrorCode.VALIDATION_ERROR,
      HttpStatusCode.BAD_REQUEST,
      context,
      true
    );
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * Authentication Error
 * Used when authentication fails
 */
export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required', context: Record<string, any> = {}) {
    super(
      message,
      ErrorCode.AUTHENTICATION_REQUIRED,
      HttpStatusCode.UNAUTHORIZED,
      context,
      true
    );
    Object.setPrototypeOf(this, AuthenticationError.prototype);
  }
}

/**
 * Invalid Credentials Error
 * Specific error for login/password failures
 */
export class InvalidCredentialsError extends AppError {
  constructor(message: string = 'Invalid email or password') {
    super(
      message,
      ErrorCode.INVALID_CREDENTIALS,
      HttpStatusCode.UNAUTHORIZED,
      {},
      true
    );
    Object.setPrototypeOf(this, InvalidCredentialsError.prototype);
  }
}

/**
 * Token Expired Error
 * Used when JWT token has expired
 */
export class TokenExpiredError extends AppError {
  constructor() {
    super(
      'Token has expired',
      ErrorCode.TOKEN_EXPIRED,
      HttpStatusCode.UNAUTHORIZED,
      {},
      true
    );
    Object.setPrototypeOf(this, TokenExpiredError.prototype);
  }
}

/**
 * Authorization Error
 * Used when user lacks required permissions
 */
export class AuthorizationError extends AppError {
  constructor(message: string = 'Access denied', context: Record<string, any> = {}) {
    super(
      message,
      ErrorCode.INSUFFICIENT_PERMISSIONS,
      HttpStatusCode.FORBIDDEN,
      context,
      true
    );
    Object.setPrototypeOf(this, AuthorizationError.prototype);
  }
}

/**
 * Not Found Error
 * Used when a resource cannot be found
 */
export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string | number) {
    const message = identifier
      ? `${resource} with id "${identifier}" not found`
      : `${resource} not found`;

    super(
      message,
      ErrorCode.NOT_FOUND,
      HttpStatusCode.NOT_FOUND,
      { resource, identifier },
      true
    );
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

/**
 * Conflict Error
 * Used when a resource already exists (duplicate)
 */
export class ConflictError extends AppError {
  constructor(message: string, context: Record<string, any> = {}) {
    super(
      message,
      ErrorCode.CONFLICT,
      HttpStatusCode.CONFLICT,
      context,
      true
    );
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

/**
 * Duplicate User Error
 * Specific error for user registration when email already exists
 */
export class DuplicateUserError extends AppError {
  constructor(email: string) {
    super(
      `User with email "${email}" already exists`,
      ErrorCode.USER_ALREADY_EXISTS,
      HttpStatusCode.CONFLICT,
      { email },
      true
    );
    Object.setPrototypeOf(this, DuplicateUserError.prototype);
  }
}

/**
 * Rate Limit Error
 * Used when rate limit is exceeded
 */
export class RateLimitError extends AppError {
  public readonly retryAfter: number;

  constructor(retryAfter: number = 60) {
    super(
      'Too many requests. Please try again later.',
      ErrorCode.TOO_MANY_REQUESTS,
      HttpStatusCode.TOO_MANY_REQUESTS,
      { retryAfter },
      true
    );
    this.retryAfter = retryAfter;
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}

/**
 * File Error
 * Used for file upload/processing errors
 */
export class FileError extends AppError {
  constructor(message: string, code: ErrorCode, context: Record<string, any> = {}) {
    super(
      message,
      code,
      HttpStatusCode.UNPROCESSABLE_ENTITY,
      context,
      true
    );
    Object.setPrototypeOf(this, FileError.prototype);
  }
}

/**
 * Invalid File Type Error
 */
export class InvalidFileTypeError extends AppError {
  constructor(providedType: string, allowedTypes: string[]) {
    super(
      `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
      ErrorCode.INVALID_FILE_TYPE,
      HttpStatusCode.UNPROCESSABLE_ENTITY,
      { providedType, allowedTypes },
      true
    );
    Object.setPrototypeOf(this, InvalidFileTypeError.prototype);
  }
}

/**
 * File Size Exceeded Error
 */
export class FileSizeExceededError extends AppError {
  constructor(fileSize: number, maxSize: number) {
    super(
      `File size (${fileSize} bytes) exceeds maximum allowed size (${maxSize} bytes)`,
      ErrorCode.FILE_SIZE_EXCEEDED,
      HttpStatusCode.UNPROCESSABLE_ENTITY,
      { fileSize, maxSize },
      true
    );
    Object.setPrototypeOf(this, FileSizeExceededError.prototype);
  }
}

/**
 * External Service Error
 * Used for errors from external APIs (OpenRouter, database, etc.)
 */
export class ExternalServiceError extends AppError {
  public readonly service: string;
  public readonly originalError?: Error;

  constructor(
    service: string,
    message: string,
    originalError?: Error,
    statusCode: HttpStatusCode = HttpStatusCode.BAD_GATEWAY
  ) {
    super(
      `${service} error: ${message}`,
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      statusCode,
      { service },
      false // Not operational - internal error
    );
    this.service = service;
    this.originalError = originalError;
    Object.setPrototypeOf(this, ExternalServiceError.prototype);
  }
}

/**
 * AI Service Error
 * Specific error for AI analysis failures
 */
export class AIServiceError extends AppError {
  constructor(message: string, originalError?: Error) {
    super(
      `AI service error: ${message}`,
      ErrorCode.AI_SERVICE_ERROR,
      HttpStatusCode.BAD_GATEWAY,
      { originalError: originalError?.message },
      false
    );
    Object.setPrototypeOf(this, AIServiceError.prototype);
  }
}

/**
 * Database Error
 * Specific error for database operation failures
 */
export class DatabaseError extends AppError {
  constructor(message: string, operation?: string) {
    super(
      `Database error: ${message}`,
      ErrorCode.DATABASE_ERROR,
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      { operation },
      false
    );
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

/**
 * Internal Server Error
 * Generic internal error for unexpected failures
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error', originalError?: Error) {
    super(
      message,
      ErrorCode.INTERNAL_SERVER_ERROR,
      HttpStatusCode.INTERNAL_SERVER_ERROR,
      { originalError: originalError?.message },
      false
    );
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}

/**
 * Service Unavailable Error
 * Used when a dependent service is down
 */
export class ServiceUnavailableError extends AppError {
  constructor(service: string) {
    super(
      `${service} is temporarily unavailable. Please try again later.`,
      ErrorCode.SERVICE_UNAVAILABLE,
      HttpStatusCode.SERVICE_UNAVAILABLE,
      { service },
      true
    );
    Object.setPrototypeOf(this, ServiceUnavailableError.prototype);
  }
}

/**
 * Gateway Timeout Error
 * Used when a request to external service times out
 */
export class GatewayTimeoutError extends AppError {
  constructor(service: string, timeout: number) {
    super(
      `Request to ${service} timed out after ${timeout}ms`,
      ErrorCode.GATEWAY_TIMEOUT,
      HttpStatusCode.GATEWAY_TIMEOUT,
      { service, timeout },
      true
    );
    Object.setPrototypeOf(this, GatewayTimeoutError.prototype);
  }
}

/**
 * Helper function to determine if an error is operational
 */
export function isOperationalError(error: unknown): error is AppError {
  return error instanceof AppError && error.isOperational === true;
}
