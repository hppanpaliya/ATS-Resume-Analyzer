import bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { ConflictError, NotFoundError } from '../utils/errors';
import { Logger } from '../utils/logger';
import { sanitizeEmail, sanitizeString } from '../utils/sanitizer';

type PrismaClientLike = Prisma.TransactionClient | typeof prisma;

type AdminAuditContext = {
  actorUserId: string;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
};

type ListUsersOptions = {
  search?: string;
  page?: number;
  pageSize?: number;
};

type UpdateUserInput = {
  email?: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  subscriptionTier?: string;
  emailVerified?: boolean;
  deleted?: boolean;
};

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

const buildUserSearchWhere = (search?: string): Prisma.UserWhereInput => {
  const normalizedSearch = sanitizeString(search).trim();

  if (!normalizedSearch) {
    return {};
  }

  return {
    OR: [
      { email: { contains: normalizedSearch } },
      { firstName: { contains: normalizedSearch } },
      { lastName: { contains: normalizedSearch } },
      { phone: { contains: normalizedSearch } },
    ],
  };
};

const buildPagination = (page?: number, pageSize?: number) => {
  const normalizedPage = Number.isFinite(page) ? Math.max(1, Number(page)) : DEFAULT_PAGE;
  const normalizedPageSize = Number.isFinite(pageSize)
    ? Math.min(MAX_PAGE_SIZE, Math.max(1, Number(pageSize)))
    : DEFAULT_PAGE_SIZE;

  return {
    page: normalizedPage,
    pageSize: normalizedPageSize,
    skip: (normalizedPage - 1) * normalizedPageSize,
    take: normalizedPageSize,
  };
};

export class AdminService {
  private async runTransaction<T>(
    callback: (client: PrismaClientLike) => Promise<T>
  ): Promise<T> {
    if (typeof prisma.$transaction === 'function') {
      return prisma.$transaction((tx) => callback(tx));
    }

    return callback(prisma);
  }

  async listUsers(options: ListUsersOptions = {}) {
    const { page, pageSize, skip, take } = buildPagination(options.page, options.pageSize);
    const where = buildUserSearchWhere(options.search);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          subscriptionTier: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
          deletedAt: true,
          _count: {
            select: {
              resumes: true,
              analyses: true,
              jobDescriptions: true,
              aiUsage: true,
              refreshSessions: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users: users.map((user) => ({
        ...user,
        counts: user._count,
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  }

  async getUserDetail(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        subscriptionTier: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        deletedAt: true,
        resumesCreated: true,
        analysesRunToday: true,
        lastAnalysisDate: true,
        aiGenerationsToday: true,
        aiOptimizationsToday: true,
        _count: {
          select: {
            resumes: true,
            analyses: true,
            jobDescriptions: true,
            aiUsage: true,
            refreshSessions: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User', userId);
    }

    const [
      recentResumes,
      recentAnalyses,
      recentJobDescriptions,
      recentAiUsage,
      recentSessions,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.resume.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
        },
      }),
      prisma.analysis.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          analysisType: true,
          aiProvider: true,
          modelUsed: true,
          status: true,
          createdAt: true,
          completedAt: true,
          errorMessage: true,
        },
      }),
      prisma.jobDescription.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        take: 10,
        select: {
          id: true,
          title: true,
          company: true,
          location: true,
          createdAt: true,
          updatedAt: true,
          deletedAt: true,
        },
      }),
      prisma.aiUsage.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          feature: true,
          aiProvider: true,
          model: true,
          tokensUsed: true,
          estimatedCost: true,
          responseTimeMs: true,
          wasCached: true,
          createdAt: true,
        },
      }),
      prisma.refreshSession.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          expiresAt: true,
          revokedAt: true,
          replacedBySessionId: true,
          createdAt: true,
          lastUsedAt: true,
        },
      }),
      prisma.auditLog.findMany({
        where: {
          OR: [
            {
              entityType: 'user',
              entityId: userId,
            },
            {
              userId,
            },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          userId: true,
          action: true,
          entityType: true,
          entityId: true,
          ipAddress: true,
          userAgent: true,
          changes: true,
          createdAt: true,
        },
      }),
    ]);

    return {
      user: {
        ...user,
        counts: user._count,
      },
      recentResumes,
      recentAnalyses,
      recentJobDescriptions,
      recentAiUsage,
      recentSessions,
      recentAuditLogs: recentAuditLogs.map((entry) => ({
        ...entry,
        changes: this.parseChanges(entry.changes),
      })),
    };
  }

  async updateUser(userId: string, input: UpdateUserInput, auditContext: AdminAuditContext) {
    const sanitizedInput = this.normalizeUpdateInput(input);

    return this.runTransaction(async (tx) => {
      const existingUser = await this.requireUser(tx, userId);
      const nextData = this.buildUserUpdateData(existingUser, sanitizedInput);

      if (Object.keys(nextData).length === 0) {
        return {
          ...existingUser,
          counts: undefined,
        };
      }

      try {
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: nextData,
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            subscriptionTier: true,
            emailVerified: true,
            createdAt: true,
            updatedAt: true,
            lastLoginAt: true,
            deletedAt: true,
          },
        });

        await this.createAuditLog(tx, auditContext, {
          action: 'ADMIN_USER_UPDATED',
          entityType: 'user',
          entityId: userId,
          changes: {
            before: this.pickAuditedUserFields(existingUser),
            after: this.pickAuditedUserFields(updatedUser),
          },
        });

        Logger.info('Admin updated user', {
          actorUserId: auditContext.actorUserId,
          targetUserId: userId,
        });

        return updatedUser;
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          throw new ConflictError('Email already in use', { email: sanitizedInput.email });
        }

        throw error;
      }
    });
  }

  async setUserPassword(userId: string, password: string, auditContext: AdminAuditContext) {
    const trimmedPassword = password.trim();

    if (trimmedPassword.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    const passwordHash = await bcrypt.hash(trimmedPassword, 10);

    return this.runTransaction(async (tx) => {
      const user = await this.requireUser(tx, userId);

      await tx.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });

      const revokedSessions = await tx.refreshSession.updateMany({
        where: {
          userId: user.id,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
          lastUsedAt: new Date(),
        },
      });

      await this.createAuditLog(tx, auditContext, {
        action: 'ADMIN_USER_PASSWORD_RESET',
        entityType: 'user',
        entityId: user.id,
        changes: {
          revokedSessions: revokedSessions.count,
          passwordChanged: true,
        },
      });

      Logger.warn('Admin reset user password', {
        actorUserId: auditContext.actorUserId,
        targetUserId: user.id,
      });

      return {
        success: true,
        revokedSessions: revokedSessions.count,
      };
    });
  }

  async revokeUserSessions(userId: string, auditContext: AdminAuditContext) {
    return this.runTransaction(async (tx) => {
      const user = await this.requireUser(tx, userId);
      const result = await tx.refreshSession.updateMany({
        where: {
          userId: user.id,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
          lastUsedAt: new Date(),
        },
      });

      await this.createAuditLog(tx, auditContext, {
        action: 'ADMIN_USER_SESSIONS_REVOKED',
        entityType: 'user',
        entityId: user.id,
        changes: {
          revokedSessions: result.count,
        },
      });

      Logger.warn('Admin revoked user sessions', {
        actorUserId: auditContext.actorUserId,
        targetUserId: user.id,
        revokedSessions: result.count,
      });

      return {
        success: true,
        revokedSessions: result.count,
      };
    });
  }

  private normalizeUpdateInput(input: UpdateUserInput) {
    const normalized: UpdateUserInput = {};

    if (input.email !== undefined) {
      normalized.email = sanitizeEmail(input.email);
    }

    if (input.firstName !== undefined) {
      normalized.firstName = input.firstName ? sanitizeString(input.firstName) : null;
    }

    if (input.lastName !== undefined) {
      normalized.lastName = input.lastName ? sanitizeString(input.lastName) : null;
    }

    if (input.phone !== undefined) {
      normalized.phone = input.phone ? sanitizeString(input.phone) : null;
    }

    if (input.subscriptionTier !== undefined) {
      normalized.subscriptionTier = sanitizeString(input.subscriptionTier);
    }

    if (input.emailVerified !== undefined) {
      normalized.emailVerified = Boolean(input.emailVerified);
    }

    if (input.deleted !== undefined) {
      normalized.deleted = Boolean(input.deleted);
    }

    return normalized;
  }

  private buildUserUpdateData(
    existingUser: {
      email: string;
      firstName: string | null;
      lastName: string | null;
      phone: string | null;
      subscriptionTier: string;
      emailVerified: boolean;
      deletedAt: Date | null;
    },
    input: UpdateUserInput
  ): Prisma.UserUpdateInput {
    const nextData: Prisma.UserUpdateInput = {};

    if (input.email !== undefined) {
      if (!input.email) {
        throw new Error('A valid email address is required');
      }

      if (input.email !== existingUser.email) {
        nextData.email = input.email;
      }
    }

    if (input.firstName !== undefined && input.firstName !== existingUser.firstName) {
      nextData.firstName = input.firstName;
    }

    if (input.lastName !== undefined && input.lastName !== existingUser.lastName) {
      nextData.lastName = input.lastName;
    }

    if (input.phone !== undefined && input.phone !== existingUser.phone) {
      nextData.phone = input.phone;
    }

    if (
      input.subscriptionTier !== undefined &&
      input.subscriptionTier &&
      input.subscriptionTier !== existingUser.subscriptionTier
    ) {
      nextData.subscriptionTier = input.subscriptionTier;
    }

    if (
      input.emailVerified !== undefined &&
      input.emailVerified !== existingUser.emailVerified
    ) {
      nextData.emailVerified = input.emailVerified;
    }

    if (input.deleted !== undefined) {
      const nextDeletedAt = input.deleted ? existingUser.deletedAt || new Date() : null;
      const currentDeletedState = Boolean(existingUser.deletedAt);

      if (Boolean(nextDeletedAt) !== currentDeletedState) {
        nextData.deletedAt = nextDeletedAt;
      }
    }

    return nextData;
  }

  private async requireUser(tx: PrismaClientLike, userId: string) {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        subscriptionTier: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        lastLoginAt: true,
        deletedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User', userId);
    }

    return user;
  }

  private async createAuditLog(
    tx: PrismaClientLike,
    auditContext: AdminAuditContext,
    entry: {
      action: string;
      entityType: string;
      entityId: string;
      changes: Record<string, unknown>;
    }
  ) {
    await tx.auditLog.create({
      data: {
        userId: auditContext.actorUserId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        ipAddress: auditContext.ipAddress,
        userAgent: auditContext.userAgent,
        changes: JSON.stringify({
          ...entry.changes,
          requestId: auditContext.requestId,
        }),
      },
    });
  }

  private pickAuditedUserFields(user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    phone: string | null;
    subscriptionTier: string;
    emailVerified: boolean;
    deletedAt: Date | null;
  }) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      subscriptionTier: user.subscriptionTier,
      emailVerified: user.emailVerified,
      deletedAt: user.deletedAt,
    };
  }

  private parseChanges(changes: string | null) {
    if (!changes) {
      return null;
    }

    try {
      return JSON.parse(changes);
    } catch (_error) {
      return changes;
    }
  }
}
