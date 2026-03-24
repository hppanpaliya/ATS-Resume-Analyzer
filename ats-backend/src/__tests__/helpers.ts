import jwt from 'jsonwebtoken';

/**
 * Test helper utilities
 * Provides utility functions commonly used across test suites
 */

export class TestHelpers {
  /**
   * Generate a valid JWT access token for testing
   */
  static generateAccessToken(userId: string, email: string): string {
    return jwt.sign(
      { userId, email },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );
  }

  /**
   * Generate a valid JWT refresh token for testing
   */
  static generateRefreshToken(userId: string, sessionId: string): string {
    return jwt.sign(
      { userId, sessionId },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    );
  }

  /**
   * Generate an expired JWT token for testing
   */
  static generateExpiredAccessToken(userId: string, email: string): string {
    return jwt.sign(
      { userId, email },
      process.env.JWT_SECRET!,
      { expiresIn: '-1h' }
    );
  }

  /**
   * Wait for a specified amount of time (useful for async operations)
   */
  static async wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create a mock Express Request object
   */
  static createMockRequest(overrides: any = {}): any {
    return {
      headers: {},
      body: {},
      params: {},
      query: {},
      user: null,
      userId: null,
      userEmail: null,
      ...overrides,
    };
  }

  /**
   * Create a mock Express Response object
   */
  static createMockResponse(): any {
    const res: any = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      end: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
      statusCode: 200,
    };
    return res;
  }

  /**
   * Create a mock Next function
   */
  static createMockNext(): jest.Mock {
    return jest.fn();
  }

  /**
   * Verify JWT token validity
   */
  static verifyToken(token: string, secret: string): any {
    try {
      return jwt.verify(token, secret);
    } catch (error) {
      return null;
    }
  }

  /**
   * Check if email is valid
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Generate a random string of specified length
   */
  static generateRandomString(length: number = 10): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return result;
  }

  /**
   * Create a mock file upload object
   */
  static createMockFile(overrides: any = {}): any {
    return {
      fieldname: 'file',
      originalname: 'resume.pdf',
      encoding: '7bit',
      mimetype: 'application/pdf',
      size: 1024000,
      buffer: Buffer.from('mock file content'),
      destination: './uploads',
      filename: 'resume-12345.pdf',
      path: './uploads/resume-12345.pdf',
      ...overrides,
    };
  }

  /**
   * Check if value is a valid UUID
   */
  static isValidUUID(uuid: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  }

  /**
   * Compare two dates (useful for checking createdAt/updatedAt)
   */
  static datesAreClose(date1: Date, date2: Date, toleranceMs: number = 1000): boolean {
    const diff = Math.abs(date1.getTime() - date2.getTime());
    return diff <= toleranceMs;
  }

  /**
   * Deep clone an object
   */
  static deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
  }

  /**
   * Get authorization header from token
   */
  static getAuthorizationHeader(token: string): string {
    return `Bearer ${token}`;
  }
}

/**
 * Test error scenarios
 */
export class TestErrors {
  static readonly INVALID_CREDENTIALS = 'Invalid credentials';
  static readonly USER_ALREADY_EXISTS = 'User already exists';
  static readonly USER_NOT_FOUND = 'User not found';
  static readonly INVALID_TOKEN = 'Invalid token';
  static readonly TOKEN_EXPIRED = 'Token expired';
  static readonly RESUME_NOT_FOUND = 'Resume not found';
  static readonly UNAUTHORIZED = 'Unauthorized';
  static readonly INVALID_INPUT = 'Invalid input';
  static readonly INTERNAL_ERROR = 'Internal server error';
}

/**
 * Test constants
 */
export class TestConstants {
  static readonly VALID_EMAIL = 'test@example.com';
  static readonly INVALID_EMAIL = 'not-an-email';
  static readonly VALID_PASSWORD = 'SecurePassword123!';
  static readonly WEAK_PASSWORD = '123';
  static readonly VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
  static readonly INVALID_UUID = 'not-a-uuid';
  static readonly TEST_USER_ID = '550e8400-e29b-41d4-a716-446655440001';
  static readonly TEST_RESUME_ID = '550e8400-e29b-41d4-a716-446655440002';
}
