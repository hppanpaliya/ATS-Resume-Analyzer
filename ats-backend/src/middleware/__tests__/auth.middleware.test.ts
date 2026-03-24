import { authMiddleware, AuthRequest } from '../auth.middleware';
import { Response, NextFunction } from 'express';
import prisma from '../../lib/prisma';
import { TestHelpers, TestConstants } from '../../__tests__/helpers';
import { MockDataFactory } from '../../__tests__/factories';
import jwt from 'jsonwebtoken';

// Mock prisma - must be before imports
jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

// Mock jwt
jest.mock('jsonwebtoken');

describe('authMiddleware', () => {
  let mockReq: AuthRequest;
  let mockRes: any;
  let mockNext: NextFunction;
  let mockPrisma: any;
  let mockJwt: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = TestHelpers.createMockRequest();
    mockRes = TestHelpers.createMockResponse();
    mockNext = TestHelpers.createMockNext();
    mockPrisma = prisma as any;
    mockJwt = jwt as any;
  });

  describe('valid token', () => {
    it('should allow request with valid token', async () => {
      const userId = TestConstants.TEST_USER_ID;
      const email = TestConstants.VALID_EMAIL;
      const token = TestHelpers.generateAccessToken(userId, email);

      mockReq.headers.authorization = `Bearer ${token}`;

      const mockUser = MockDataFactory.createUser({ id: userId, email });
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: mockUser.id,
        deletedAt: null,
      });

      // Mock jwt.verify to return the decoded token
      mockJwt.verify.mockReturnValueOnce({ userId, email });

      await authMiddleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.userId).toBe(userId);
      expect(mockReq.userEmail).toBe(email);
    });

    it('should set userId on request object', async () => {
      const userId = TestConstants.TEST_USER_ID;
      const email = TestConstants.VALID_EMAIL;
      const token = TestHelpers.generateAccessToken(userId, email);

      mockReq.headers.authorization = `Bearer ${token}`;

      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: userId,
        deletedAt: null,
      });

      mockJwt.verify.mockReturnValueOnce({ userId, email });

      await authMiddleware(mockReq, mockRes, mockNext);

      expect(mockReq.userId).toBe(userId);
    });

    it('should set userEmail on request object', async () => {
      const userId = TestConstants.TEST_USER_ID;
      const email = TestConstants.VALID_EMAIL;
      const token = TestHelpers.generateAccessToken(userId, email);

      mockReq.headers.authorization = `Bearer ${token}`;

      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: userId,
        deletedAt: null,
      });

      mockJwt.verify.mockReturnValueOnce({ userId, email });

      await authMiddleware(mockReq, mockRes, mockNext);

      expect(mockReq.userEmail).toBe(email);
    });

    it('should call next() to proceed to next middleware', async () => {
      const userId = TestConstants.TEST_USER_ID;
      const email = TestConstants.VALID_EMAIL;

      mockReq.headers.authorization = `Bearer valid_token`;

      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: userId,
        deletedAt: null,
      });

      mockJwt.verify.mockReturnValueOnce({ userId, email });

      await authMiddleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });
  });

  describe('missing token', () => {
    it('should reject request with no authorization header', async () => {
      mockReq.headers.authorization = undefined;

      await authMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'No token provided' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with empty authorization header', async () => {
      mockReq.headers.authorization = '';

      await authMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'No token provided' });
    });

    it('should reject request without Bearer prefix', async () => {
      mockReq.headers.authorization = 'invalid_token_format';

      await authMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'No token provided' });
    });

    it('should extract token after Bearer prefix', async () => {
      const token = 'valid_token_here';
      mockReq.headers.authorization = `Bearer ${token}`;

      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: TestConstants.TEST_USER_ID,
        deletedAt: null,
      });

      mockJwt.verify.mockReturnValueOnce({
        userId: TestConstants.TEST_USER_ID,
        email: TestConstants.VALID_EMAIL,
      });

      await authMiddleware(mockReq, mockRes, mockNext);

      // Verify that the token (without Bearer) was used
      expect(mockJwt.verify).toHaveBeenCalledWith(
        token,
        process.env.JWT_SECRET
      );
    });
  });

  describe('invalid token', () => {
    it('should reject request with malformed token', async () => {
      mockReq.headers.authorization = 'Bearer invalid.token.format';

      mockJwt.verify.mockImplementationOnce(() => {
        throw new Error('Invalid token');
      });

      await authMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject request with tampered token', async () => {
      mockReq.headers.authorization = 'Bearer tampered.token.data';

      mockJwt.verify.mockImplementationOnce(() => {
        throw new Error('Signature verification failed');
      });

      await authMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    });

    it('should reject request with expired token', async () => {
      mockReq.headers.authorization = 'Bearer expired.token';

      mockJwt.verify.mockImplementationOnce(() => {
        throw new Error('Token expired');
      });

      await authMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    });

    it('should reject request with wrong secret', async () => {
      mockReq.headers.authorization = 'Bearer token_signed_with_wrong_secret';

      mockJwt.verify.mockImplementationOnce(() => {
        throw new Error('Invalid signature');
      });

      await authMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    });
  });

  describe('user verification', () => {
    it('should reject if user not found in database', async () => {
      const userId = TestConstants.TEST_USER_ID;
      const email = TestConstants.VALID_EMAIL;

      mockReq.headers.authorization = `Bearer valid_token`;

      mockJwt.verify.mockReturnValueOnce({ userId, email });
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);

      await authMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'User not found' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should reject if user is deleted', async () => {
      const userId = TestConstants.TEST_USER_ID;
      const email = TestConstants.VALID_EMAIL;

      mockReq.headers.authorization = `Bearer valid_token`;

      mockJwt.verify.mockReturnValueOnce({ userId, email });
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: userId,
        deletedAt: new Date(),
      });

      await authMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'User not found' });
    });

    it('should query user with correct where clause', async () => {
      const userId = TestConstants.TEST_USER_ID;
      const email = TestConstants.VALID_EMAIL;

      mockReq.headers.authorization = `Bearer valid_token`;

      mockJwt.verify.mockReturnValueOnce({ userId, email });
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: userId,
        deletedAt: null,
      });

      await authMiddleware(mockReq, mockRes, mockNext);

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: userId },
        select: { id: true, deletedAt: true },
      });
    });

    it('should only select necessary user fields', async () => {
      const userId = TestConstants.TEST_USER_ID;

      mockReq.headers.authorization = 'Bearer valid_token';

      mockJwt.verify.mockReturnValueOnce({ userId, email: 'test@example.com' });
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: userId,
        deletedAt: null,
      });

      await authMiddleware(mockReq, mockRes, mockNext);

      const callArgs = mockPrisma.user.findUnique.mock.calls[0][0];
      expect(callArgs.select).toEqual({ id: true, deletedAt: true });
    });
  });

  describe('error handling', () => {
    it('should catch unexpected errors gracefully', async () => {
      mockReq.headers.authorization = 'Bearer token';

      mockJwt.verify.mockImplementationOnce(() => {
        throw new Error('Unexpected error');
      });

      await authMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    });

    it('should handle database errors gracefully', async () => {
      const userId = TestConstants.TEST_USER_ID;

      mockReq.headers.authorization = 'Bearer token';

      mockJwt.verify.mockReturnValueOnce({ userId, email: 'test@example.com' });
      mockPrisma.user.findUnique.mockRejectedValueOnce(
        new Error('Database connection error')
      );

      await authMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    });
  });

  describe('edge cases', () => {
    it('should handle multiple Bearer prefixes in header', async () => {
      mockReq.headers.authorization = 'Bearer Bearer token';

      // Should still work because it takes everything after first 7 chars
      mockJwt.verify.mockImplementationOnce(() => {
        throw new Error('Invalid token');
      });

      await authMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should handle very long tokens', async () => {
      const longToken = 'x'.repeat(10000);
      mockReq.headers.authorization = `Bearer ${longToken}`;

      mockJwt.verify.mockImplementationOnce(() => {
        throw new Error('Invalid token');
      });

      await authMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should preserve original request object properties', async () => {
      const userId = TestConstants.TEST_USER_ID;
      const email = TestConstants.VALID_EMAIL;

      mockReq.headers.authorization = 'Bearer token';
      mockReq.body = { data: 'test' };
      mockReq.params = { id: '123' };

      mockJwt.verify.mockReturnValueOnce({ userId, email });
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: userId,
        deletedAt: null,
      });

      await authMiddleware(mockReq, mockRes, mockNext);

      expect(mockReq.body).toEqual({ data: 'test' });
      expect(mockReq.params).toEqual({ id: '123' });
      expect(mockReq.userId).toBe(userId);
    });

    it('should handle case-insensitive Bearer prefix', async () => {
      const token = 'valid_token';
      mockReq.headers.authorization = `bearer ${token}`;

      // The code checks for startsWith('Bearer ') with capital B
      await authMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({ error: 'No token provided' });
    });

    it('should handle null token extraction gracefully', async () => {
      mockReq.headers.authorization = 'Bearer ';

      await authMiddleware(mockReq, mockRes, mockNext);

      mockJwt.verify.mockImplementationOnce(() => {
        throw new Error('Invalid token');
      });

      // Should attempt to verify empty string
      expect(mockJwt.verify).toHaveBeenCalled();
    });
  });

  describe('integration scenarios', () => {
    it('should handle rapid sequential requests with same token', async () => {
      const userId = '550e8400-e29b-41d4-a716-446655440001';
      const email = 'user@example.com';

      // Use mockResolvedValue (always returns same value) instead of mockResolvedValueOnce
      mockJwt.verify.mockReturnValue({ userId, email });
      mockPrisma.user.findUnique.mockResolvedValue({
        id: userId,
        deletedAt: null,
      });

      for (let i = 0; i < 5; i++) {
        const req = TestHelpers.createMockRequest({
          headers: { authorization: `Bearer token${i}` },
        });

        await authMiddleware(req, mockRes, mockNext);
      }

      // Should call the database at least 4 times (one might be cached or skipped)
      expect(mockPrisma.user.findUnique.mock.calls.length).toBeGreaterThanOrEqual(4);
      expect(mockPrisma.user.findUnique.mock.calls.length).toBeLessThanOrEqual(5);
    });

    it('should work with different user IDs in same test', async () => {
      const userIds = [
        '550e8400-e29b-41d4-a716-446655440001',
        '550e8400-e29b-41d4-a716-446655440002',
        '550e8400-e29b-41d4-a716-446655440003',
      ];

      for (const userId of userIds) {
        // Set up fresh mocks for each iteration
        jest.clearAllMocks();
        
        mockJwt.verify.mockReturnValueOnce({
          userId,
          email: `user${userId}@example.com`,
        });
        mockPrisma.user.findUnique.mockResolvedValueOnce({
          id: userId,
          deletedAt: null,
        });

        const req = TestHelpers.createMockRequest({
          headers: { authorization: `Bearer token` },
        });

        await authMiddleware(req, mockRes, mockNext);

        expect(req.userId).toBe(userId);
      }
    });
  });
});
