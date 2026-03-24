import { AuthService } from '../auth.service';
import prisma from '../../lib/prisma';
import { MockDataFactory } from '../../__tests__/factories';
import { TestHelpers, TestConstants } from '../../__tests__/helpers';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createHash } from 'crypto';

// Mock prisma - must be before imports
jest.mock('../../lib/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    refreshSession: {
      create: jest.fn(),
      findUnique: jest.fn(),
      updateMany: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
  },
}));

// Mock bcrypt
jest.mock('bcrypt');

describe('AuthService', () => {
  let authService: AuthService;
  let mockPrisma: any;
  let mockBcrypt: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
    authService = new AuthService();
    mockPrisma = prisma as any;
    mockBcrypt = bcrypt as any;

    // Set up default mock implementations
    mockBcrypt.hash.mockResolvedValue('hashed_password');
    mockBcrypt.compare.mockResolvedValue(true);
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      const email = TestConstants.VALID_EMAIL;
      const password = TestConstants.VALID_PASSWORD;
      const firstName = 'John';
      const lastName = 'Doe';

      const mockUser = MockDataFactory.createUser({ email, firstName, lastName });
      const mockSession = MockDataFactory.createRefreshSession(mockUser.id);

      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      mockPrisma.user.create.mockResolvedValueOnce(mockUser);
      mockPrisma.refreshSession.create.mockResolvedValueOnce(mockSession);

      const result = await authService.register(email, password, firstName, lastName);

      expect(result.user).toEqual(mockUser);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(mockBcrypt.hash).toHaveBeenCalledWith(password, 10);
      expect(mockPrisma.user.create).toHaveBeenCalled();
    });

    it('should throw error if user already exists', async () => {
      const email = TestConstants.VALID_EMAIL;
      const existingUser = MockDataFactory.createUser({ email });

      mockPrisma.user.findUnique.mockResolvedValueOnce(existingUser);

      await expect(
        authService.register(email, 'password123')
      ).rejects.toThrow('User already exists');
    });

    it('should hash password using bcrypt', async () => {
      const email = TestConstants.VALID_EMAIL;
      const password = TestConstants.VALID_PASSWORD;

      const mockUser = MockDataFactory.createUser({ email });

      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      mockPrisma.user.create.mockResolvedValueOnce(mockUser);
      mockPrisma.refreshSession.create.mockResolvedValueOnce(
        MockDataFactory.createRefreshSession(mockUser.id)
      );

      await authService.register(email, password);

      expect(mockBcrypt.hash).toHaveBeenCalledWith(password, 10);
    });

    it('should generate both access and refresh tokens', async () => {
      const email = TestConstants.VALID_EMAIL;
      const mockUser = MockDataFactory.createUser({ email });

      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      mockPrisma.user.create.mockResolvedValueOnce(mockUser);
      mockPrisma.refreshSession.create.mockResolvedValueOnce(
        MockDataFactory.createRefreshSession(mockUser.id)
      );

      const result = await authService.register(email, 'password123');

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(typeof result.accessToken).toBe('string');
      expect(typeof result.refreshToken).toBe('string');
    });

    it('should register user with optional first and last name', async () => {
      const email = TestConstants.VALID_EMAIL;
      const mockUser = MockDataFactory.createUser({ email });

      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      mockPrisma.user.create.mockResolvedValueOnce(mockUser);
      mockPrisma.refreshSession.create.mockResolvedValueOnce(
        MockDataFactory.createRefreshSession(mockUser.id)
      );

      await authService.register(email, 'password123');

      expect(mockPrisma.user.create).toHaveBeenCalled();
    });

    it('should call pruneRefreshSessions', async () => {
      const email = TestConstants.VALID_EMAIL;
      const mockUser = MockDataFactory.createUser({ email });

      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      mockPrisma.user.create.mockResolvedValueOnce(mockUser);
      mockPrisma.refreshSession.create.mockResolvedValueOnce(
        MockDataFactory.createRefreshSession(mockUser.id)
      );

      mockPrisma.refreshSession.deleteMany.mockResolvedValueOnce({ count: 0 });

      await authService.register(email, 'password123');

      // Verify deleteMany was called (part of pruneRefreshSessions)
      expect(mockPrisma.refreshSession.deleteMany).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should log in user with correct credentials', async () => {
      const email = TestConstants.VALID_EMAIL;
      const password = TestConstants.VALID_PASSWORD;
      const mockUser = MockDataFactory.createUser({ email });

      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);
      mockBcrypt.compare.mockResolvedValueOnce(true);
      mockPrisma.user.update.mockResolvedValueOnce(mockUser);
      mockPrisma.refreshSession.create.mockResolvedValueOnce(
        MockDataFactory.createRefreshSession(mockUser.id)
      );
      mockPrisma.refreshSession.deleteMany.mockResolvedValueOnce({ count: 0 });

      const result = await authService.login(email, password);

      expect(result.user).toEqual(mockUser);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(mockBcrypt.compare).toHaveBeenCalledWith(password, mockUser.passwordHash);
    });

    it('should throw error if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      mockPrisma.refreshSession.deleteMany.mockResolvedValueOnce({ count: 0 });

      await expect(
        authService.login('nonexistent@example.com', 'password123')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error if password is incorrect', async () => {
      const mockUser = MockDataFactory.createUser();

      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);
      mockBcrypt.compare.mockResolvedValueOnce(false);
      mockPrisma.refreshSession.deleteMany.mockResolvedValueOnce({ count: 0 });

      await expect(
        authService.login(mockUser.email, 'wrongpassword')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should throw error if user is deleted', async () => {
      const mockUser = MockDataFactory.createUser({ deletedAt: new Date() });

      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);
      mockPrisma.refreshSession.deleteMany.mockResolvedValueOnce({ count: 0 });

      await expect(
        authService.login(mockUser.email, 'password123')
      ).rejects.toThrow('Invalid credentials');
    });

    it('should update lastLoginAt on successful login', async () => {
      const mockUser = MockDataFactory.createUser();

      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);
      mockBcrypt.compare.mockResolvedValueOnce(true);
      mockPrisma.user.update.mockResolvedValueOnce(mockUser);
      mockPrisma.refreshSession.create.mockResolvedValueOnce(
        MockDataFactory.createRefreshSession(mockUser.id)
      );
      mockPrisma.refreshSession.deleteMany.mockResolvedValueOnce({ count: 0 });

      await authService.login(mockUser.email, 'password123');

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { lastLoginAt: expect.any(Date) },
      });
    });

    it('should continue login when lastLoginAt update fails with readonly sqlite error', async () => {
      const mockUser = MockDataFactory.createUser();

      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);
      mockBcrypt.compare.mockResolvedValueOnce(true);
      mockPrisma.user.update.mockRejectedValueOnce(
        new Error('attempt to write a readonly database (extended_code: 1032)')
      );
      mockPrisma.refreshSession.create.mockResolvedValueOnce(
        MockDataFactory.createRefreshSession(mockUser.id)
      );
      mockPrisma.refreshSession.deleteMany.mockResolvedValueOnce({ count: 0 });

      const result = await authService.login(mockUser.email, 'password123');

      expect(result.user).toEqual(mockUser);
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(mockPrisma.user.update).toHaveBeenCalledTimes(1);
      expect(mockPrisma.refreshSession.create).toHaveBeenCalledTimes(1);
    });

    it('should generate tokens with user id and email', async () => {
      const mockUser = MockDataFactory.createUser();

      mockPrisma.user.findUnique.mockResolvedValueOnce(mockUser);
      mockBcrypt.compare.mockResolvedValueOnce(true);
      mockPrisma.user.update.mockResolvedValueOnce(mockUser);
      mockPrisma.refreshSession.create.mockResolvedValueOnce(
        MockDataFactory.createRefreshSession(mockUser.id)
      );
      mockPrisma.refreshSession.deleteMany.mockResolvedValueOnce({ count: 0 });

      const result = await authService.login(mockUser.email, 'password123');

      // Verify tokens can be decoded
      const decodedAccess = jwt.verify(result.accessToken, process.env.JWT_SECRET!);
      expect(decodedAccess).toHaveProperty('userId', mockUser.id);
      expect(decodedAccess).toHaveProperty('email', mockUser.email);
    });
  });

  describe('refreshToken', () => {
    it('should generate new access token from refresh token', async () => {
      const mockUser = MockDataFactory.createUser();
      const mockSession = MockDataFactory.createRefreshSession(mockUser.id);
      const refreshToken = TestHelpers.generateRefreshToken(mockUser.id, mockSession.id);
      const tokenHash = createHash('sha256').update(refreshToken).digest('hex');

      mockPrisma.refreshSession.deleteMany.mockResolvedValueOnce({ count: 0 });
      mockPrisma.refreshSession.findUnique.mockResolvedValueOnce({
        ...mockSession,
        tokenHash, // Use computed hash
      });
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: mockUser.id,
        email: mockUser.email,
        deletedAt: null,
      });
      const newSession = MockDataFactory.createRefreshSession(mockUser.id);
      mockPrisma.refreshSession.create.mockResolvedValueOnce(newSession);
      mockPrisma.refreshSession.update.mockResolvedValueOnce(newSession);

      const result = await authService.refreshToken(refreshToken);

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw error if refresh token is invalid', async () => {
      mockPrisma.refreshSession.deleteMany.mockResolvedValueOnce({ count: 0 });

      await expect(
        authService.refreshToken('invalid_token')
      ).rejects.toThrow('Invalid refresh token');
    });

    it('should throw error if token hash does not match', async () => {
      const mockUser = MockDataFactory.createUser();
      const mockSession = MockDataFactory.createRefreshSession(mockUser.id, {
        tokenHash: 'different_hash',
      });
      const refreshToken = TestHelpers.generateRefreshToken(mockUser.id, mockSession.id);

      mockPrisma.refreshSession.deleteMany.mockResolvedValueOnce({ count: 0 });
      mockPrisma.refreshSession.findUnique.mockResolvedValueOnce(mockSession);

      await expect(
        authService.refreshToken(refreshToken)
      ).rejects.toThrow();
    });

    it('should throw error if token is expired', async () => {
      const mockUser = MockDataFactory.createUser();
      const mockSession = MockDataFactory.createRefreshSession(mockUser.id, {
        expiresAt: new Date(Date.now() - 1000),
      });
      const refreshToken = TestHelpers.generateRefreshToken(mockUser.id, mockSession.id);

      mockPrisma.refreshSession.deleteMany.mockResolvedValueOnce({ count: 0 });
      mockPrisma.refreshSession.findUnique.mockResolvedValueOnce(mockSession);

      await expect(
        authService.refreshToken(refreshToken)
      ).rejects.toThrow();
    });

    it('should throw error if session is already revoked', async () => {
      const mockUser = MockDataFactory.createUser();
      const mockSession = MockDataFactory.createRefreshSession(mockUser.id, {
        revokedAt: new Date(),
      });
      const refreshToken = TestHelpers.generateRefreshToken(mockUser.id, mockSession.id);

      mockPrisma.refreshSession.deleteMany.mockResolvedValueOnce({ count: 0 });
      mockPrisma.refreshSession.findUnique.mockResolvedValueOnce(mockSession);
      mockPrisma.refreshSession.updateMany.mockResolvedValueOnce({ count: 1 });

      await expect(
        authService.refreshToken(refreshToken)
      ).rejects.toThrow();
    });

    it('should throw error if user is deleted', async () => {
      const mockUser = MockDataFactory.createUser();
      const mockSession = MockDataFactory.createRefreshSession(mockUser.id);
      const refreshToken = TestHelpers.generateRefreshToken(mockUser.id, mockSession.id);

      mockPrisma.refreshSession.deleteMany.mockResolvedValueOnce({ count: 0 });
      mockPrisma.refreshSession.findUnique.mockResolvedValueOnce(mockSession);
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: mockUser.id,
        email: mockUser.email,
        deletedAt: new Date(),
      });
      mockPrisma.refreshSession.updateMany.mockResolvedValueOnce({ count: 1 });

      await expect(
        authService.refreshToken(refreshToken)
      ).rejects.toThrow();
    });
  });

  describe('revokeAllRefreshSessions', () => {
    it('should revoke all active sessions for a user', async () => {
      const userId = TestConstants.TEST_USER_ID;

      mockPrisma.refreshSession.updateMany.mockResolvedValueOnce({ count: 3 });

      await authService.revokeAllRefreshSessions(userId);

      expect(mockPrisma.refreshSession.updateMany).toHaveBeenCalledWith({
        where: {
          userId,
          revokedAt: null,
        },
        data: {
          revokedAt: expect.any(Date),
          lastUsedAt: expect.any(Date),
        },
      });
    });

    it('should not affect already revoked sessions', async () => {
      const userId = TestConstants.TEST_USER_ID;

      mockPrisma.refreshSession.updateMany.mockResolvedValueOnce({ count: 0 });

      await authService.revokeAllRefreshSessions(userId);

      expect(mockPrisma.refreshSession.updateMany).toHaveBeenCalled();
    });
  });

  describe('revokeRefreshSession', () => {
    it('should revoke a specific refresh session', async () => {
      const mockUser = MockDataFactory.createUser();
      const mockSession = MockDataFactory.createRefreshSession(mockUser.id);
      const refreshToken = TestHelpers.generateRefreshToken(mockUser.id, mockSession.id);

      mockPrisma.refreshSession.findUnique.mockResolvedValueOnce({
        userId: mockUser.id,
      });
      mockPrisma.refreshSession.updateMany.mockResolvedValueOnce({ count: 1 });

      await authService.revokeRefreshSession(refreshToken);

      expect(mockPrisma.refreshSession.findUnique).toHaveBeenCalled();
      expect(mockPrisma.refreshSession.updateMany).toHaveBeenCalled();
    });

    it('should handle non-existent session gracefully', async () => {
      const refreshToken = 'non_existent_token';

      mockPrisma.refreshSession.findUnique.mockResolvedValueOnce(null);

      await authService.revokeRefreshSession(refreshToken);

      expect(mockPrisma.refreshSession.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      const userId = TestConstants.TEST_USER_ID;
      const email = TestConstants.VALID_EMAIL;
      const token = TestHelpers.generateAccessToken(userId, email);

      const decoded = authService.verifyAccessToken(token);

      expect(decoded).toHaveProperty('userId', userId);
      expect(decoded).toHaveProperty('email', email);
    });

    it('should throw error for invalid token', () => {
      expect(() => {
        authService.verifyAccessToken('invalid_token');
      }).toThrow();
    });

    it('should throw error for expired token', () => {
      const userId = TestConstants.TEST_USER_ID;
      const email = TestConstants.VALID_EMAIL;
      const token = TestHelpers.generateExpiredAccessToken(userId, email);

      expect(() => {
        authService.verifyAccessToken(token);
      }).toThrow();
    });
  });

  describe('edge cases', () => {
    it('should handle register with very long names', async () => {
      const mockUser = MockDataFactory.createUser();
      const longName = 'a'.repeat(500);

      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      mockPrisma.user.create.mockResolvedValueOnce(mockUser);
      mockPrisma.refreshSession.create.mockResolvedValueOnce(
        MockDataFactory.createRefreshSession(mockUser.id)
      );
      mockPrisma.refreshSession.deleteMany.mockResolvedValueOnce({ count: 0 });

      const result = await authService.register(
        TestConstants.VALID_EMAIL,
        'password123',
        longName,
        longName
      );

      expect(result.user).toBeDefined();
    });

    it('should handle concurrent login attempts', async () => {
      const mockUser = MockDataFactory.createUser();

      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockBcrypt.compare.mockResolvedValue(true);
      mockPrisma.user.update.mockResolvedValue(mockUser);
      mockPrisma.refreshSession.create.mockResolvedValue(
        MockDataFactory.createRefreshSession(mockUser.id)
      );
      mockPrisma.refreshSession.deleteMany.mockResolvedValue({ count: 0 });

      const results = await Promise.all([
        authService.login(mockUser.email, 'password123'),
        authService.login(mockUser.email, 'password123'),
        authService.login(mockUser.email, 'password123'),
      ]);

      expect(results).toHaveLength(3);
      results.forEach((result: any) => {
        expect(result.accessToken).toBeDefined();
        expect(result.refreshToken).toBeDefined();
      });
    });

    it('should handle session pruning (old tokens cleaned up)', async () => {
      const mockUser = MockDataFactory.createUser();

      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      mockPrisma.user.create.mockResolvedValueOnce(mockUser);
      mockPrisma.refreshSession.create.mockResolvedValueOnce(
        MockDataFactory.createRefreshSession(mockUser.id)
      );
      mockPrisma.refreshSession.deleteMany.mockResolvedValueOnce({ count: 5 });

      await authService.register(TestConstants.VALID_EMAIL, 'password123');

      expect(mockPrisma.refreshSession.deleteMany).toHaveBeenCalled();
    });
  });
});
