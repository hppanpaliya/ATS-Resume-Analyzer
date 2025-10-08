"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResumeService = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
class ResumeService {
    async createResume(userId, title, content, templateId) {
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
    async getResumes(userId, page = 1, limit = 10, status) {
        const skip = (page - 1) * limit;
        const where = {
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
    async getResumeById(resumeId, userId) {
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
    async updateResume(resumeId, userId, data) {
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
                content: existing.content,
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
    async deleteResume(resumeId, userId) {
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
exports.ResumeService = ResumeService;
//# sourceMappingURL=resume.service.js.map