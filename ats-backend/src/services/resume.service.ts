import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ResumeService {
  async createResume(userId: string, title: string, content: any, templateId?: string) {
    const resume = await prisma.resume.create({
      data: {
        userId,
        title,
        content,
        templateId,
        status: 'draft',
      },
    });

    // Increment user's resume count
    await prisma.user.update({
      where: { id: userId },
      data: { resumesCreated: { increment: 1 } },
    });

    return resume;
  }

  async getResumes(userId: string, page = 1, limit = 10, status?: string) {
    const skip = (page - 1) * limit;

    const where: any = {
      userId,
      deletedAt: null,
    };

    if (status) {
      where.status = status;
    }

    const [resumes, total] = await Promise.all([
      prisma.resume.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          template: {
            select: { id: true, name: true, category: true },
          },
        },
      }),
      prisma.resume.count({ where }),
    ]);

    return {
      resumes,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getResumeById(resumeId: string, userId: string) {
    const resume = await prisma.resume.findFirst({
      where: {
        id: resumeId,
        userId,
        deletedAt: null,
      },
      include: {
        template: true,
      },
    });

    if (!resume) {
      throw new Error('Resume not found');
    }

    // Update last accessed
    await prisma.resume.update({
      where: { id: resumeId },
      data: { lastAccessedAt: new Date() },
    });

    return resume;
  }

  async updateResume(resumeId: string, userId: string, data: any) {
    // Verify ownership
    const existing = await prisma.resume.findFirst({
      where: { id: resumeId, userId, deletedAt: null },
    });

    if (!existing) {
      throw new Error('Resume not found');
    }

    // Create version before updating
    await prisma.resumeVersion.create({
      data: {
        resumeId,
        versionNumber: existing.version,
        content: existing.content as any,
        changeSummary: 'Manual edit',
        changeType: 'manual',
      },
    });

    // Update resume
    const updated = await prisma.resume.update({
      where: { id: resumeId },
      data: {
        ...data,
        version: { increment: 1 },
        updatedAt: new Date(),
      },
    });

    return updated;
  }

  async deleteResume(resumeId: string, userId: string) {
    const existing = await prisma.resume.findFirst({
      where: { id: resumeId, userId, deletedAt: null },
    });

    if (!existing) {
      throw new Error('Resume not found');
    }

    await prisma.resume.update({
      where: { id: resumeId },
      data: { deletedAt: new Date() },
    });
  }
}