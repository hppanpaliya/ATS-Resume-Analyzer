import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createHash, randomUUID } from 'crypto';
import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';
import { AuthenticationError, ConflictError, InvalidCredentialsError } from '../utils/errors';
import { Logger } from '../utils/logger';

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export class AuthService {
  private lastPruneRun = 0;

  private async runTransaction<T>(
    callback: (client: Prisma.TransactionClient | typeof prisma) => Promise<T>
  ): Promise<T> {
    if (typeof prisma.$transaction === 'function') {
      return (await (prisma as any).$transaction(
        async (tx: Prisma.TransactionClient) => callback(tx)
      )) as T;
    }

    return callback(prisma as Prisma.TransactionClient | typeof prisma);
  }

  async register(email: string, password: string, firstName?: string, lastName?: string) {
    await this.pruneRefreshSessions();

    try {
      return await this.runTransaction(async (tx) => {
        const existingUser = await tx.user.findUnique({ where: { email } });
        if (existingUser) {
          throw new ConflictError('User already exists', { email });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await tx.user.create({
          data: {
            email,
            passwordHash,
            firstName,
            lastName,
          },
        });

        const accessToken = this.generateAccessToken(user.id, email);
        const refreshSession = await this.createRefreshSession(user.id, tx);

        return { user, accessToken, refreshToken: refreshSession.token };
      });
    } catch (error) {
      if (error instanceof ConflictError) {
        throw error;
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictError('User already exists', { email });
      }

      throw error;
    }
  }

  async login(email: string, password: string) {
    await this.pruneRefreshSessions();

    // Find user
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || user.deletedAt) {
      throw new InvalidCredentialsError('Invalid credentials');
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      throw new InvalidCredentialsError('Invalid credentials');
    }

    // Update last login (best effort so metadata write does not block authentication)
    await this.updateLastLoginAt(user.id);

    // Generate tokens
    const accessToken = this.generateAccessToken(user.id, user.email);
    const refreshSession = await this.createRefreshSession(user.id);

    return { user, accessToken, refreshToken: refreshSession.token };
  }

  private async updateLastLoginAt(userId: string): Promise<void> {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { lastLoginAt: new Date() },
      });
    } catch (error) {
      if (this.isRecoverableLastLoginUpdateError(error)) {
        Logger.warn('Skipping non-critical lastLoginAt update after successful credential validation', {
          userId,
          reason: error instanceof Error ? error.message : String(error),
        });
        return;
      }

      throw error;
    }
  }

  private isRecoverableLastLoginUpdateError(error: unknown): boolean {
    if (!(error instanceof Error)) {
      return false;
    }

    const normalizedMessage = error.message.toLowerCase();

    return (
      normalizedMessage.includes('attempt to write a readonly database') ||
      normalizedMessage.includes('readonly database') ||
      normalizedMessage.includes('extended_code: 1032') ||
      normalizedMessage.includes('database is locked')
    );
  }

  async refreshToken(refreshToken: string) {
    await this.pruneRefreshSessions();

    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET!) as any;

      if (!decoded?.userId || !decoded?.sessionId) {
        throw new AuthenticationError('Invalid refresh token');
      }

      const tokenHash = this.hashToken(refreshToken);

      const currentSession = await prisma.refreshSession.findUnique({
        where: { id: decoded.sessionId },
      });

      if (!currentSession || currentSession.userId !== decoded.userId) {
        throw new AuthenticationError('Invalid refresh token');
      }

      if (currentSession.revokedAt) {
        await this.revokeAllRefreshSessions(currentSession.userId);
        throw new AuthenticationError('Refresh token reuse detected');
      }

      if (currentSession.tokenHash !== tokenHash) {
        await this.revokeAllRefreshSessions(currentSession.userId);
        throw new AuthenticationError('Invalid refresh token');
      }

      if (currentSession.expiresAt <= new Date()) {
        await prisma.refreshSession.update({
          where: { id: currentSession.id },
          data: {
            revokedAt: new Date(),
            lastUsedAt: new Date(),
          },
        });
        throw new AuthenticationError('Refresh token expired');
      }

      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, email: true, deletedAt: true },
      });

      if (!user || user.deletedAt) {
        if (user?.id) {
          await this.revokeAllRefreshSessions(user.id);
        }
        throw new AuthenticationError('User not found');
      }

      const accessToken = this.generateAccessToken(user.id, user.email);
      const newSession = await this.createRefreshSession(user.id);

      await prisma.refreshSession.update({
        where: { id: currentSession.id },
        data: {
          revokedAt: new Date(),
          replacedBySessionId: newSession.sessionId,
          lastUsedAt: new Date(),
        },
      });

      return { accessToken, refreshToken: newSession.token };
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }

      const errorName = error instanceof Error ? error.name : '';
      if (errorName === 'TokenExpiredError' || errorName === 'JsonWebTokenError' || errorName === 'NotBeforeError') {
        throw new AuthenticationError('Invalid refresh token');
      }

      throw error;
    }
  }

  async revokeAllRefreshSessions(userId: string) {
    await prisma.refreshSession.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
        lastUsedAt: new Date(),
      },
    });
  }

  async revokeRefreshSession(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    const session = await prisma.refreshSession.findUnique({
      where: { tokenHash },
      select: { userId: true },
    });

    if (!session) {
      return;
    }

    await this.revokeAllRefreshSessions(session.userId);
  }

  private async pruneRefreshSessions() {
    const nowMs = Date.now();
    if (nowMs - this.lastPruneRun < 10 * 60 * 1000) {
      return;
    }

    const now = new Date();
    const staleRevokedCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    await prisma.refreshSession.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: now } },
          {
            revokedAt: {
              not: null,
              lt: staleRevokedCutoff,
            },
          },
        ],
      },
    });

    this.lastPruneRun = nowMs;
  }

  private generateAccessToken(userId: string, email: string): string {
    return jwt.sign(
      { userId, email },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );
  }

  private generateRefreshToken(userId: string, sessionId: string): string {
    return jwt.sign(
      { userId, sessionId },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    );
  }

  private hashToken(token: string) {
    return createHash('sha256').update(token).digest('hex');
  }

  private async createRefreshSession(
    userId: string,
    client: Prisma.TransactionClient | typeof prisma = prisma
  ): Promise<{ token: string; sessionId: string }> {
    const sessionId = randomUUID();
    const token = this.generateRefreshToken(userId, sessionId);
    const tokenHash = this.hashToken(token);

    await client.refreshSession.create({
      data: {
        id: sessionId,
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
    });

    return { token, sessionId };
  }

  verifyAccessToken(token: string) {
    return jwt.verify(token, process.env.JWT_SECRET!);
  }
}
