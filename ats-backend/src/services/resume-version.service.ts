/**
 * Resume Version Service
 * Manages resume version history and change tracking
 */

import { Prisma } from '@prisma/client';
import prisma from '../lib/prisma';

type PrismaClientLike = Prisma.TransactionClient | typeof prisma;

export class ResumeVersionService {
  /**
   * Creates a version snapshot before modifying a resume
   * @param resumeId - Resume ID to version
   * @param currentVersion - Current version number
   * @param content - Resume content to save
   * @param changeSummary - Description of what changed
   * @param changeType - Type of change (manual, ai, import, etc.)
   * @returns Created version record
   * @throws Error if resume not found or creation fails
   */
  async createVersion(
    resumeId: string,
    currentVersion: number,
    content: any,
    changeSummary: string = 'Manual edit',
    changeType: string = 'manual',
    client: PrismaClientLike = prisma
  ) {
    const version = await client.resumeVersion.create({
      data: {
        resumeId,
        versionNumber: currentVersion,
        content,
        changeSummary,
        changeType,
      },
    });

    return version;
  }

  /**
   * Gets all versions of a resume
   * @param resumeId - Resume ID
   * @param userId - User ID (for authorization)
   * @returns Array of version records
   * @throws Error if resume not found or not authorized
   */
  async getVersionHistory(resumeId: string, userId: string) {
    // Verify ownership first
    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, userId, deletedAt: null },
    });

    if (!resume) {
      throw new Error('Resume not found');
    }

    const versions = await prisma.resumeVersion.findMany({
      where: { resumeId },
      orderBy: { createdAt: 'desc' },
    });

    return versions;
  }

  /**
   * Gets a specific version of a resume
   * @param resumeId - Resume ID
   * @param versionNumber - Version number to retrieve
   * @param userId - User ID (for authorization)
   * @returns Version record
   * @throws Error if version not found or not authorized
   */
  async getVersion(resumeId: string, versionNumber: number, userId: string) {
    // Verify ownership first
    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, userId, deletedAt: null },
    });

    if (!resume) {
      throw new Error('Resume not found');
    }

    const version = await prisma.resumeVersion.findFirst({
      where: { resumeId, versionNumber },
    });

    if (!version) {
      throw new Error('Version not found');
    }

    return version;
  }

  /**
   * Restores a resume to a previous version
   * @param resumeId - Resume ID
   * @param versionNumber - Version number to restore
   * @param userId - User ID (for authorization)
   * @returns Updated resume record
   * @throws Error if version not found or not authorized
   */
  async restoreVersion(resumeId: string, versionNumber: number, userId: string) {
    const version = await this.getVersion(resumeId, versionNumber, userId);

    // Create a version of current state before restoring
    const resume = await prisma.resume.findUnique({
      where: { id: resumeId },
    });

    if (!resume) {
      throw new Error('Resume not found');
    }

    // Save current state as a version
    await this.createVersion(
      resumeId,
      resume.version,
      resume.content,
      `Restored from version ${versionNumber}`,
      'restore',
      prisma
    );

    // Restore the old version
    const restored = await prisma.resume.update({
      where: { id: resumeId },
      data: {
        content: version.content,
        version: { increment: 1 },
        updatedAt: new Date(),
      },
    });

    return restored;
  }

  /**
   * Deletes old versions of a resume (cleanup)
   * @param resumeId - Resume ID
   * @param keepVersions - Number of recent versions to keep (default: 10)
   * @returns Number of versions deleted
   */
  async deleteOldVersions(resumeId: string, keepVersions: number = 10) {
    const versions = await prisma.resumeVersion.findMany({
      where: { resumeId },
      orderBy: { createdAt: 'desc' },
      skip: keepVersions,
      select: { id: true },
    });

    if (versions.length === 0) {
      return 0;
    }

    const result = await prisma.resumeVersion.deleteMany({
      where: {
        id: {
          in: versions.map(v => v.id),
        },
      },
    });

    return result.count;
  }

  /**
   * Gets version statistics for a resume
   * @param resumeId - Resume ID
   * @param userId - User ID (for authorization)
   * @returns Version statistics
   */
  async getVersionStats(resumeId: string, userId: string) {
    // Verify ownership first
    const resume = await prisma.resume.findFirst({
      where: { id: resumeId, userId, deletedAt: null },
    });

    if (!resume) {
      throw new Error('Resume not found');
    }

    const versions = await prisma.resumeVersion.findMany({
      where: { resumeId },
    });

    const changeTypeGroups = versions.reduce((acc: Record<string, number>, v) => {
      const changeType = v.changeType || 'unknown';
      acc[changeType] = (acc[changeType] || 0) + 1;
      return acc;
    }, {});

    return {
      totalVersions: versions.length,
      changeTypes: changeTypeGroups,
      oldestVersion: versions[versions.length - 1]?.createdAt,
      newestVersion: versions[0]?.createdAt,
    };
  }
}
