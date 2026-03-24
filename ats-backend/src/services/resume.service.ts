import { FileStorageService } from './file-storage.service';
import { ResumeFileService, ResumeFileData } from './resume-file.service';
import { ResumeExportService } from './resume-export.service';
import { ResumeAnalysisService } from './resume-analysis.service';
import { ResumeVersionService } from './resume-version.service';
import prisma from '../lib/prisma';
import { safeJsonParse } from '../lib/json';

/**
 * Resume Service - Core CRUD operations for resumes
 * Delegates export, analysis, and versioning to specialized services
 */
export class ResumeService {
  private fileStorage?: FileStorageService;
  private resumeFileService?: ResumeFileService;
  private exportService: ResumeExportService;
  private analysisService: ResumeAnalysisService;
  private versionService: ResumeVersionService;

  constructor(
    fileStorage?: FileStorageService,
    resumeFileService?: ResumeFileService
  ) {
    this.fileStorage = fileStorage;
    this.resumeFileService = resumeFileService;
    this.exportService = new ResumeExportService();
    this.analysisService = new ResumeAnalysisService();
    this.versionService = new ResumeVersionService();
  }

  async createResume(
    userId: string,
    title: string,
    content?: any,
    templateId?: string,
    fileData?: ResumeFileData
  ) {
    const resumeData: any = {
      userId,
      title,
      templateId,
      status: 'draft',
    };

    // Handle different content types
    if (fileData) {
      // File-based resume
      resumeData.structuredData = fileData.structuredData ? JSON.stringify(fileData.structuredData) : null;
      resumeData.extractedText = fileData.processedContent.text;
      resumeData.originalFileId = fileData.originalFile.id;
      resumeData.originalFileName = fileData.originalFile.originalName;
      resumeData.originalFileSize = fileData.originalFile.size;
      resumeData.originalFileType = fileData.originalFile.mimeType;
      resumeData.fileProcessedAt = new Date();
    } else if (content) {
      // Text-based resume (legacy support)
      if (typeof content === 'string') {
        resumeData.content = content;
        resumeData.extractedText = content;
      } else {
        // Structured data
        resumeData.structuredData = JSON.stringify(content);
        resumeData.extractedText = this.analysisService.extractTextFromStructuredData(content);
      }
    }

    const resume = await prisma.resume.create({
      data: resumeData,
    });

    // Increment user's resume count
    await prisma.user.update({
      where: { id: userId },
      data: { resumesCreated: { increment: 1 } },
    });

    return resume;
  }

  async createResumeFromFile(
    userId: string,
    title: string,
    file: Express.Multer.File,
    templateId?: string
  ) {
    if (!this.resumeFileService) {
      throw new Error('ResumeFileService not initialized');
    }

    const fileData = await this.resumeFileService.processResumeFile(file, userId);
    return this.createResume(userId, title, undefined, templateId, fileData);
  }

  async createResumeFromText(
    userId: string,
    title: string,
    content: string | object,
    templateId?: string
  ) {
    return this.createResume(userId, title, content, templateId);
  }

  async createResumeFromStructuredData(
    userId: string,
    title: string,
    structuredData: object,
    templateId?: string
  ) {
    return this.createResume(userId, title, structuredData, templateId);
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
        select: {
          id: true,
          title: true,
          content: true,
          extractedText: true,
          status: true,
          templateId: true,
          createdAt: true,
          updatedAt: true,
          originalFileId: true,
          originalFileName: true,
          originalFileSize: true,
          originalFileType: true,
          template: {
            select: { id: true, name: true, category: true },
          },
        },
      }) as any,
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

    // Parse structured data if it exists
    const structuredData = safeJsonParse<Record<string, any> | null>(
      (resume as any).structuredData,
      null
    );

    return {
      ...resume,
      structuredData,
      // For backward compatibility, provide content field
      content: resume.content || resume.extractedText || (structuredData ? this.analysisService.extractTextFromStructuredData(structuredData) : ''),
    };
  }

  async getResumeFile(resumeId: string, userId: string): Promise<Buffer | null> {
    const resume = await prisma.resume.findFirst({
      where: {
        id: resumeId,
        userId,
        deletedAt: null,
        originalFileId: { not: null },
      } as any,
    }) as any;

    if (!resume || !resume.originalFileId) {
      return null;
    }

    if (!this.resumeFileService) {
      throw new Error('ResumeFileService not initialized');
    }

    return this.resumeFileService.getResumeFile(resume.originalFileId, userId);
  }

  async getResumeFileMetadata(resumeId: string, userId: string) {
    const resume = await prisma.resume.findFirst({
      where: {
        id: resumeId,
        userId,
        deletedAt: null,
        originalFileId: { not: null },
      } as any,
    }) as any;

    if (!resume || !resume.originalFileId) {
      return null;
    }

    if (!this.resumeFileService) {
      throw new Error('ResumeFileService not initialized');
    }

    const fileMetadata = await this.resumeFileService.getResumeFileMetadata(resume.originalFileId, userId);
    if (!fileMetadata) {
      return null;
    }

    return {
      ...fileMetadata,
      resumeId,
      resumeTitle: resume.title,
    };
  }

  async updateResume(
    resumeId: string,
    userId: string,
    data: {
      title?: string;
      content?: string;
      templateId?: string | null;
      structuredData?: string | Record<string, any> | null;
    }
  ) {
    // Verify ownership
    const existing = await prisma.resume.findFirst({
      where: { id: resumeId, userId, deletedAt: null },
    });

    if (!existing) {
      throw new Error('Resume not found');
    }

    const updateData: Record<string, any> = {
      version: { increment: 1 },
      updatedAt: new Date(),
    };

    if (typeof data.title === 'string') {
      updateData.title = data.title.trim();
    }

    if (typeof data.content === 'string') {
      updateData.content = data.content;
      updateData.extractedText = data.content;
    }

    if (data.templateId === null || typeof data.templateId === 'string') {
      updateData.templateId = data.templateId;
    }

    if (data.structuredData !== undefined) {
      if (data.structuredData === null) {
        updateData.structuredData = null;
      } else if (typeof data.structuredData === 'string') {
        updateData.structuredData = data.structuredData;
      } else {
        updateData.structuredData = JSON.stringify(data.structuredData);
      }

      if (!updateData.extractedText && updateData.structuredData) {
        const parsed = safeJsonParse<Record<string, any> | null>(updateData.structuredData, null);
        updateData.extractedText = parsed ? this.analysisService.extractTextFromStructuredData(parsed) : existing.extractedText;
      }
    }

    return prisma.$transaction(async (tx) => {
      await this.versionService.createVersion(
        resumeId,
        existing.version,
        existing.content,
        'Manual edit',
        'manual',
        tx
      );

      return tx.resume.update({
        where: { id: resumeId },
        data: updateData,
      });
    });
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

  /**
   * Exports resume to PDF format
   * Delegates to ResumeExportService
   */
  async exportToPDF(resumeId: string, userId: string): Promise<Buffer> {
    return this.exportService.exportToPDF(resumeId, userId);
  }

  /**
   * Exports resume to Word (DOCX) format
   * Delegates to ResumeExportService
   */
  async exportToWord(resumeId: string, userId: string): Promise<Buffer> {
    return this.exportService.exportToWord(resumeId, userId);
  }

  /**
   * Parses resume text using AI
   * Delegates to ResumeAnalysisService
   */
  async parseResumeWithAI(text: string, userId: string) {
    return this.analysisService.parseResumeWithAI(text, userId);
  }

  /**
   * Generates formatted HTML for resume export
   * Delegates to ResumeExportService
   */
  generateFormattedHTML(structuredResume: any, template: any = null): string {
    return this.exportService.generateFormattedHTML(structuredResume, template);
  }
}
