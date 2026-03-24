import bcrypt from 'bcrypt';
import prisma from '../../lib/prisma';
import { MockDataFactory } from '../../__tests__/factories';
import { AdminService } from '../admin.service';

jest.mock('../../lib/prisma', () => {
  const tx = {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    resume: {
      findMany: jest.fn(),
    },
    analysis: {
      findMany: jest.fn(),
    },
    jobDescription: {
      findMany: jest.fn(),
    },
    aiUsage: {
      findMany: jest.fn(),
    },
    refreshSession: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
    auditLog: {
      findMany: jest.fn(),
      create: jest.fn(),
    },
  };

  return {
    __esModule: true,
    default: {
      ...tx,
      $transaction: jest.fn(async (callback: any) => callback(tx)),
    },
  };
});

jest.mock('bcrypt');

describe('AdminService', () => {
  let adminService: AdminService;
  let mockPrisma: any;
  let mockBcrypt: any;
  let adminUser: any;
  let targetUser: any;
  let auditContext: {
    actorUserId: string;
    ipAddress: string;
    userAgent: string;
    requestId: string;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();

    adminService = new AdminService();
    mockPrisma = prisma as any;
    mockBcrypt = bcrypt as any;

    mockPrisma.$transaction.mockImplementation(async (callback: (client: any) => unknown) => callback(mockPrisma));

    adminUser = MockDataFactory.createUser({
      id: 'admin-user-id',
      email: 'admin@example.com',
      subscriptionTier: 'admin',
      emailVerified: true,
      phone: '555-0101',
    });
    targetUser = MockDataFactory.createUser({
      id: 'target-user-id',
      email: 'target@example.com',
      subscriptionTier: 'free',
      emailVerified: false,
      phone: null,
    });
    auditContext = {
      actorUserId: adminUser.id,
      ipAddress: '127.0.0.1',
      userAgent: 'jest',
      requestId: 'req-123',
    };

    mockBcrypt.hash.mockResolvedValue('new-hash');
  });

  it('lists users with pagination and counts', async () => {
    mockPrisma.user.findMany.mockResolvedValueOnce([
      {
        ...targetUser,
        _count: {
          resumes: 2,
          analyses: 3,
          jobDescriptions: 1,
          aiUsage: 4,
          refreshSessions: 2,
        },
      },
    ]);
    mockPrisma.user.count.mockResolvedValueOnce(1);

    const result = await adminService.listUsers({
      search: 'target',
      page: 2,
      pageSize: 10,
    });

    expect(mockPrisma.user.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
        where: expect.objectContaining({
          OR: expect.any(Array),
        }),
      })
    );
    expect(result.users).toHaveLength(1);
    expect(result.users[0].counts.analyses).toBe(3);
    expect(result.pagination).toEqual({
      page: 2,
      pageSize: 10,
      total: 1,
      totalPages: 1,
    });
  });

  it('returns detailed user activity and parsed audit changes', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      ...targetUser,
      resumesCreated: 1,
      analysesRunToday: 0,
      lastAnalysisDate: null,
      aiGenerationsToday: 0,
      aiOptimizationsToday: 0,
      _count: {
        resumes: 1,
        analyses: 2,
        jobDescriptions: 1,
        aiUsage: 3,
        refreshSessions: 1,
      },
    });
    mockPrisma.resume.findMany.mockResolvedValueOnce([
      MockDataFactory.createResume(targetUser.id, { title: 'Resume A' }),
    ]);
    mockPrisma.analysis.findMany.mockResolvedValueOnce([
      {
        id: 'analysis-1',
        analysisType: 'match',
        aiProvider: 'openrouter',
        modelUsed: 'model-1',
        status: 'completed',
        createdAt: new Date(),
        completedAt: new Date(),
        errorMessage: null,
      },
    ]);
    mockPrisma.jobDescription.findMany.mockResolvedValueOnce([
      MockDataFactory.createJobDescription(targetUser.id, { title: 'Engineer' }),
    ]);
    mockPrisma.aiUsage.findMany.mockResolvedValueOnce([
      {
        id: 'usage-1',
        feature: 'analysis',
        aiProvider: 'openrouter',
        model: 'model-1',
        tokensUsed: 200,
        estimatedCost: '0.01',
        responseTimeMs: 500,
        wasCached: false,
        createdAt: new Date(),
      },
    ]);
    mockPrisma.refreshSession.findMany.mockResolvedValueOnce([
      MockDataFactory.createRefreshSession(targetUser.id),
    ]);
    mockPrisma.auditLog.findMany.mockResolvedValueOnce([
      {
        id: 'audit-1',
        userId: adminUser.id,
        action: 'ADMIN_USER_UPDATED',
        entityType: 'user',
        entityId: targetUser.id,
        ipAddress: '127.0.0.1',
        userAgent: 'jest',
        changes: JSON.stringify({ before: { email: targetUser.email }, after: { email: 'next@example.com' } }),
        createdAt: new Date(),
      },
    ]);

    const result = await adminService.getUserDetail(targetUser.id);

    expect(result.user.counts.aiUsage).toBe(3);
    expect(result.recentResumes[0].title).toBe('Resume A');
    expect(result.recentAuditLogs[0].changes).toEqual({
      before: { email: targetUser.email },
      after: { email: 'next@example.com' },
    });
  });

  it('updates safe user fields and writes an audit log', async () => {
    const updatedUser = {
      ...targetUser,
      email: 'updated@example.com',
      firstName: 'Updated',
      lastName: 'Name',
      phone: '555-0102',
      subscriptionTier: 'pro',
      emailVerified: true,
      deletedAt: null,
    };

    mockPrisma.user.findUnique.mockResolvedValueOnce(targetUser);
    mockPrisma.user.update.mockResolvedValueOnce(updatedUser);
    mockPrisma.auditLog.create.mockResolvedValueOnce({ id: 'audit-1' });

    const result = await adminService.updateUser(
      targetUser.id,
      {
        email: 'updated@example.com',
        firstName: 'Updated',
        lastName: 'Name',
        phone: '555-0102',
        subscriptionTier: 'pro',
        emailVerified: true,
      },
      auditContext
    );

    expect(mockPrisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: targetUser.id },
        data: expect.objectContaining({
          email: 'updated@example.com',
          firstName: 'Updated',
          lastName: 'Name',
          phone: '555-0102',
          subscriptionTier: 'pro',
          emailVerified: true,
        }),
      })
    );
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: adminUser.id,
          action: 'ADMIN_USER_UPDATED',
          entityId: targetUser.id,
        }),
      })
    );
    expect(result.email).toBe('updated@example.com');
  });

  it('hashes a new password, revokes sessions, and audits the action', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(targetUser);
    mockPrisma.user.update.mockResolvedValueOnce({ ...targetUser, passwordHash: 'new-hash' });
    mockPrisma.refreshSession.updateMany.mockResolvedValueOnce({ count: 2 });
    mockPrisma.auditLog.create.mockResolvedValueOnce({ id: 'audit-1' });

    const result = await adminService.setUserPassword(
      targetUser.id,
      'SecureNewPassword123!',
      auditContext
    );

    expect(mockBcrypt.hash).toHaveBeenCalledWith('SecureNewPassword123!', 10);
    expect(mockPrisma.refreshSession.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: targetUser.id,
          revokedAt: null,
        }),
      })
    );
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'ADMIN_USER_PASSWORD_RESET',
        }),
      })
    );
    expect(result).toEqual({
      success: true,
      revokedSessions: 2,
    });
  });

  it('revokes active user sessions and writes an audit log', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce(targetUser);
    mockPrisma.refreshSession.updateMany.mockResolvedValueOnce({ count: 3 });
    mockPrisma.auditLog.create.mockResolvedValueOnce({ id: 'audit-1' });

    const result = await adminService.revokeUserSessions(targetUser.id, auditContext);

    expect(result).toEqual({
      success: true,
      revokedSessions: 3,
    });
    expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          action: 'ADMIN_USER_SESSIONS_REVOKED',
        }),
      })
    );
  });
});
