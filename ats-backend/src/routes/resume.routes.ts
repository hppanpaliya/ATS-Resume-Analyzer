import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { resumeUploadsPerMonthLimiter, analysesPerDayLimiter } from '../middleware/rate-limiter.middleware';
import { ResumeService } from '../services/resume.service';
import { FileStorageService } from '../services/file-storage.service';
import { ResumeFileService } from '../services/resume-file.service';
import { AIService } from '../services/ai.service';
import prisma from '../lib/prisma';
import { safeJsonParse } from '../lib/json';
import {
  sanitizeResumeTitle,
  sanitizeResumeContent,
  sanitizeJSON,
  sanitizeJobDescription,
  sanitizeJobTitle,
} from '../utils/sanitizer';
import {
  parsePagination,
  buildPaginationMeta,
  buildResumeWhereClause,
  buildResumeOrderBy,
  validateSortField,
  validateSortOrder,
  formatResumeForList,
  type ResumeFilterOptions,
} from '../utils/pagination';
import type {
  ModelParameters,
  ResumeUpdateRequestBody,
  ResumeAnalyzeRequestBody,
  ResumesPreviewRequestBody,
  ResumesParseRequestBody,
  AnalysisResult,
} from '../types/index';

const router: Router = Router();

const parseModelParameters = (body: any): ModelParameters => {
  const temperatureParam = Number.parseFloat(String(body.temperature ?? ''));
  const maxTokensParam = Number.parseInt(String(body.max_tokens ?? ''), 10);

  return {
    temperature: Number.isFinite(temperatureParam)
      ? Math.min(Math.max(temperatureParam, 0), 2)
      : undefined,
    max_tokens: Number.isFinite(maxTokensParam)
      ? Math.min(Math.max(maxTokensParam, 500), 16000)
      : undefined,
    include_reasoning: body.include_reasoning === 'true' || body.include_reasoning === true,
  };
};

const normalizeResumeUpdatePayload = (body: any): ResumeUpdateRequestBody => {
  const allowedKeys = ['title', 'content', 'templateId', 'structuredData'];
  const incomingKeys = Object.keys(body || {});
  const invalidKeys = incomingKeys.filter((key) => !allowedKeys.includes(key));

  if (invalidKeys.length > 0) {
    throw new Error(`Unsupported fields: ${invalidKeys.join(', ')}`);
  }

  const normalized: ResumeUpdateRequestBody = {};

  if (body.title !== undefined) {
    if (typeof body.title !== 'string' || body.title.trim().length === 0 || body.title.length > 200) {
      throw new Error('Title must be a non-empty string up to 200 characters');
    }
    // Sanitize title to prevent XSS
    normalized.title = sanitizeResumeTitle(body.title);
  }

  if (body.content !== undefined) {
    if (typeof body.content !== 'string' || body.content.trim().length === 0) {
      throw new Error('Content must be a non-empty string');
    }

    if (body.content.length > 100000) {
      throw new Error('Content must be 100000 characters or fewer');
    }

    // Sanitize content to prevent XSS while preserving some formatting
    normalized.content = sanitizeResumeContent(body.content);
  }

  if (body.templateId !== undefined) {
    const normalizedTemplateId = body.templateId === '' ? null : body.templateId;

    if (normalizedTemplateId !== null && typeof normalizedTemplateId !== 'string') {
      throw new Error('Template ID must be a string or null');
    }
    normalized.templateId = normalizedTemplateId;
  }

  if (body.structuredData !== undefined) {
    if (body.structuredData !== null && typeof body.structuredData !== 'string' && typeof body.structuredData !== 'object') {
      throw new Error('Structured data must be an object, JSON string, or null');
    }

    if (typeof body.structuredData === 'string' && body.structuredData.length > 200000) {
      throw new Error('Structured data must be 200000 characters or fewer');
    }

    // Sanitize structured data recursively
    if (body.structuredData !== null) {
      if (typeof body.structuredData === 'string') {
        try {
          normalized.structuredData = sanitizeJSON(JSON.parse(body.structuredData));
        } catch {
          throw new Error('Structured data must be valid JSON');
        }
      } else {
        normalized.structuredData = sanitizeJSON(body.structuredData);
      }
    } else {
      normalized.structuredData = body.structuredData;
    }
  }

  if (Object.keys(normalized).length === 0) {
    throw new Error('No valid fields to update');
  }

  return normalized;
};

// Initialize services
const fileStorage = new FileStorageService();
const resumeFileService = new ResumeFileService(fileStorage);
const resumeService = new ResumeService(fileStorage, resumeFileService);
const aiService = new AIService();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: fileStorage.getMaxFileSize(),
  },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (fileStorage.getAllowedTypes().includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${file.mimetype} is not allowed. Allowed types: ${fileStorage.getAllowedTypes().join(', ')}`));
    }
  },
});

let isFileStorageReady = false;
let fileStorageInitializationError: Error | null = null;

const fileStorageInitializationPromise = fileStorage.initialize()
  .then(() => {
    isFileStorageReady = true;
  })
  .catch((error: unknown) => {
    fileStorageInitializationError = error instanceof Error ? error : new Error(String(error));
    console.error('Failed to initialize file storage:', fileStorageInitializationError);
  });

const ensureFileStorageReady = async (_req: Request, res: Response, next: NextFunction) => {
  if (!isFileStorageReady && !fileStorageInitializationError) {
    await fileStorageInitializationPromise;
  }

  if (isFileStorageReady) {
    return next();
  }

  return res.status(503).json({
    error: 'File storage service is unavailable. Please try again shortly.',
  });
};

router.use(ensureFileStorageReady);

// All routes require authentication
router.use(authMiddleware);

// GET /api/resumes
// Query parameters:
// - page: Page number (default: 1)
// - limit: Items per page (default: 10, max: 100)
// - search: Search in title and content (?search=junior developer)
// - status: Filter by status (draft|published)
// - templateId: Filter by template (?templateId=xxx)
// - sortBy: Sort field (createdAt|updatedAt|title, default: updatedAt)
// - order: Sort order (asc|desc, default: desc)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const pagination = parsePagination(
      req.query.page as string | number | undefined,
      req.query.limit as string | number | undefined
    );

    // Build filter options
    const filters: ResumeFilterOptions = {
      status: req.query.status as 'draft' | 'published' | undefined,
      templateId: req.query.templateId as string | undefined,
      search: req.query.search as string | undefined,
      sortBy: validateSortField(
        req.query.sortBy as string | undefined,
        ['createdAt', 'updatedAt', 'title'],
        'updatedAt'
      ) as 'createdAt' | 'updatedAt' | 'title',
      order: validateSortOrder(req.query.order as string | undefined),
    };

    // Build where clause
    const where = buildResumeWhereClause(req.userId!, filters);
    const orderBy = buildResumeOrderBy(filters.sortBy, filters.order);

    // Fetch resumes and total count
    const [resumes, totalCount] = await Promise.all([
      prisma.resume.findMany({
        where,
        skip: pagination.offset,
        take: pagination.limit,
        orderBy,
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
      }),
      prisma.resume.count({ where }),
    ]);

    const paginationMeta = buildPaginationMeta(
      pagination.page,
      pagination.limit,
      totalCount
    );

    // Format resumes for response
    const formattedResumes = resumes.map(formatResumeForList);

    res.json({
      success: true,
      data: {
        resumes: formattedResumes,
        pagination: paginationMeta,
      },
    });
  } catch (_error: unknown) {
    res.status(500).json({ error: 'Failed to fetch resumes' });
  }
});

// POST /api/resumes
router.post('/', resumeUploadsPerMonthLimiter, upload.single('resume'), async (req: AuthRequest & { file?: Express.Multer.File }, res: Response) => {
  try {
    const { title, content, templateId, structuredData } = req.body;
    const normalizedTemplateId = templateId === '' ? null : templateId;

    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: 'Title is required' });
    }

    const normalizedTitle = sanitizeResumeTitle(title);
    if (normalizedTitle.length < 2 || normalizedTitle.length > 200) {
      return res.status(400).json({ error: 'Title must be between 2 and 200 characters' });
    }

    if (normalizedTemplateId !== undefined && normalizedTemplateId !== null && typeof normalizedTemplateId !== 'string') {
      return res.status(400).json({ error: 'Template ID must be a string' });
    }

    if (content !== undefined && content !== null) {
      if (typeof content !== 'string') {
        return res.status(400).json({ error: 'Content must be a string' });
      }

      const contentLength = content.trim().length;
      if (contentLength > 100000) {
        return res.status(400).json({ error: 'Content must be 100000 characters or fewer' });
      }
    }

    let resume;

    if (req.file) {
      resume = await resumeService.createResumeFromFile(
        req.userId!,
        normalizedTitle,
        req.file,
        normalizedTemplateId ?? undefined
      );
    } else if (structuredData) {
      // Structured data (JSON)
      const parsedData = safeJsonParse<any>(structuredData, null);
      if (!parsedData) {
        return res.status(400).json({ error: 'Invalid structured data format' });
      }

      resume = await resumeService.createResumeFromStructuredData(
        req.userId!,
        normalizedTitle,
        sanitizeJSON(parsedData),
        normalizedTemplateId ?? undefined
      );
    } else if (content) {
      // Plain text content
      resume = await resumeService.createResumeFromText(
        req.userId!,
        normalizedTitle,
        sanitizeResumeContent(content),
        normalizedTemplateId ?? undefined
      );
    } else {
      return res.status(400).json({ error: 'Either file, structuredData, or content is required' });
    }

    res.status(201).json({ success: true, data: { resume } });
  } catch (_error: unknown) {
    res.status(500).json({ error: 'Failed to create resume' });
  }
});

// GET /api/resumes/:id
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const resume = await resumeService.getResumeById(req.params.id as string, req.userId!);
    res.json({ success: true, data: { resume } });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Resume not found') {
      return res.status(404).json({ error: err.message });
    }

    res.status(500).json({ error: 'Failed to fetch resume' });
  }
});

const updateResumeHandler = async (req: AuthRequest, res: Response) => {
  try {
    const normalizedPayload = normalizeResumeUpdatePayload(req.body);

    const resume = await resumeService.updateResume(
      req.params.id as string,
      req.userId!,
      normalizedPayload
    );
    res.json({ success: true, data: { resume } });
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message?.startsWith('Unsupported fields:') || err.message === 'No valid fields to update' || err.message?.includes('must be')) {
      return res.status(400).json({ error: err.message });
    }

    if (err.message === 'Resume not found') {
      return res.status(404).json({ error: err.message });
    }

    res.status(500).json({ error: 'Failed to update resume' });
  }
};

// PATCH /api/resumes/:id
router.patch('/:id', updateResumeHandler);

// PUT /api/resumes/:id
router.put('/:id', updateResumeHandler);

// DELETE /api/resumes/:id
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await resumeService.deleteResume(req.params.id as string, req.userId!);
    res.status(204).send();
  } catch (error: unknown) {
    const err = error as Error;
    if (err.message === 'Resume not found') {
      return res.status(404).json({ error: err.message });
    }

    res.status(500).json({ error: 'Failed to delete resume' });
  }
});

// GET /api/resumes/:id/file - Download original resume file
router.get('/:id/file', async (req: AuthRequest, res: Response) => {
  try {
    const fileBuffer = await resumeService.getResumeFile(req.params.id as string, req.userId!);

    if (!fileBuffer) {
      return res.status(404).json({ error: 'Original file not found' });
    }

    const metadata = await resumeService.getResumeFileMetadata(req.params.id as string, req.userId!);

    if (!metadata) {
      return res.status(404).json({ error: 'File metadata not found' });
    }

    res.setHeader('Content-Type', metadata.mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${metadata.originalName}"`);
    res.setHeader('Content-Length', metadata.size);
    res.send(fileBuffer);
  } catch (_error: unknown) {
    res.status(500).json({ error: 'Failed to download file' });
  }
});

// GET /api/resumes/:id/file/metadata - Get file metadata
router.get('/:id/file/metadata', async (req: AuthRequest, res: Response) => {
  try {
    const metadata = await resumeService.getResumeFileMetadata(req.params.id as string, req.userId!);

    if (!metadata) {
      return res.status(404).json({ error: 'File metadata not found' });
    }

    res.json({ success: true, data: metadata });
  } catch (_error: unknown) {
    res.status(500).json({ error: 'Failed to load file metadata' });
  }
});

// GET /api/resumes/:id/export/pdf
router.get('/:id/export/pdf', async (req: AuthRequest, res: Response) => {
  try {
    const pdfBuffer = await resumeService.exportToPDF(req.params.id as string, req.userId!);

    // Set headers for binary response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="resume-${req.params.id}.pdf"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    // Send the buffer directly without any transformation
    res.status(200).end(pdfBuffer);
  } catch (_error: unknown) {
    res.status(500).json({ error: 'Failed to export PDF' });
  }
});

// GET /api/resumes/:id/export/word
router.get('/:id/export/word', async (req: AuthRequest, res: Response) => {
  try {
    const wordBuffer = await resumeService.exportToWord(req.params.id as string, req.userId!);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename="resume-${req.params.id}.docx"`);
    res.send(wordBuffer);
  } catch (_error: unknown) {
    res.status(500).json({ error: 'Failed to export Word document' });
  }
});

// POST /api/resumes/parse
router.post('/parse', async (req: AuthRequest, res: Response) => {
  try {
    const body = req.body as ResumesParseRequestBody;
    const { text } = body;

    if (!text || typeof text !== 'string' || text.trim().length < 30) {
      return res.status(400).json({ error: 'Resume text must be at least 30 characters' });
    }

    const parsedResume = await resumeService.parseResumeWithAI(text.trim(), req.userId!);
    res.json({ success: true, data: parsedResume });
  } catch (_error: unknown) {
    res.status(500).json({ error: 'Failed to parse resume' });
  }
});

// POST /api/resumes/:id/analyze
router.post('/:id/analyze', analysesPerDayLimiter, async (req: AuthRequest, res: Response) => {
  try {
    const body = req.body as ResumeAnalyzeRequestBody;
    const { selectedModel } = body;

    const normalizedJobDescription = typeof body.jobDescription === 'string'
      ? sanitizeJobDescription(body.jobDescription)
      : '';
    const normalizedJobTitle = typeof body.jobTitle === 'string' && body.jobTitle.trim().length > 0
      ? sanitizeJobTitle(body.jobTitle)
      : 'Untitled Job';

    if (!normalizedJobDescription || normalizedJobDescription.trim().length < 30) {
      return res.status(400).json({ error: 'Job description must be at least 30 characters' });
    }

    const resume = await prisma.resume.findFirst({
      where: { id: req.params.id as string, userId: req.userId!, deletedAt: null },
      select: {
        id: true,
        title: true,
        extractedText: true,
        content: true,
      },
    });

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    const resumeText = (resume.extractedText || resume.content || '').trim();
    if (resumeText.length < 50) {
      return res.status(400).json({ error: 'Resume content is too short to analyze' });
    }

    const modelParameters = parseModelParameters(req.body);

    const analysisResult = await aiService.analyzeResume(
      resumeText,
      normalizedJobDescription.trim(),
      selectedModel,
      modelParameters
    );

    const savedData = await prisma.$transaction(async (tx: any) => {
      let jobDesc = await tx.jobDescription.findFirst({
        where: {
          userId: req.userId!,
          title: normalizedJobTitle,
        },
      });

      if (!jobDesc) {
        jobDesc = await tx.jobDescription.create({
          data: {
            userId: req.userId!,
            title: normalizedJobTitle,
            description: normalizedJobDescription.trim(),
          },
        });
      } else {
        jobDesc = await tx.jobDescription.update({
          where: { id: jobDesc.id },
          data: {
            description: normalizedJobDescription.trim(),
            updatedAt: new Date(),
          },
        });
      }

      const analysis = await tx.analysis.create({
        data: {
          userId: req.userId!,
          resumeId: resume.id,
          jobDescriptionId: jobDesc.id,
          analysisType: 'ats_analysis',
          aiProvider: (analysisResult as AnalysisResult).modelUsed?.provider || 'unknown',
          modelUsed: (analysisResult as AnalysisResult).modelUsed?.id || selectedModel || 'unknown',
          results: JSON.stringify(analysisResult),
          status: 'completed',
          completedAt: new Date(),
          processingTimeMs: (analysisResult as AnalysisResult).processingTime || null,
          tokensUsed: (analysisResult as AnalysisResult).tokensUsed || null,
        },
      });

      return { jobDesc, analysis };
    });

    res.json({
      success: true,
      data: {
        ...analysisResult,
        savedAnalysisId: savedData.analysis.id,
        savedResumeId: resume.id,
        savedJobDescriptionId: savedData.jobDesc.id,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to analyze resume';
    res.status(500).json({ error: message });
  }
});

// GET /api/resumes/:id/preview
router.get('/:id/preview', async (req: AuthRequest, res: Response) => {
  try {
    const resume = await prisma.resume.findFirst({
      where: { id: req.params.id as string, userId: req.userId!, deletedAt: null },
      include: { template: true },
    }) as any;

    if (!resume) {
      return res.status(404).json({ error: 'Resume not found' });
    }

    // Try to parse content as JSON, fallback to plain text
    const structuredContent = typeof resume.content === 'string'
      ? safeJsonParse<Record<string, any> | null>(resume.content, { text: resume.content })
      : resume.content;

    const safeContent = structuredContent ?? { text: resume.content ?? '' };
    const html = resumeService.generateFormattedHTML(safeContent, resume.template);
    res.send(html);
  } catch (_error: unknown) {
    res.status(500).json({ error: 'Failed to generate preview' });
  }
});

// POST /api/resumes/preview
router.post('/preview', async (req: AuthRequest, res: Response) => {
  try {
    const body = req.body as ResumesPreviewRequestBody;
    const { content, templateId } = body;

    if (!content || typeof content !== 'object') {
      return res.status(400).json({ error: 'Preview content is required' });
    }

    // Find template if specified
    const template = templateId ? await prisma.template.findUnique({
      where: { id: templateId },
    }) : null;

    const html = resumeService.generateFormattedHTML(content, template);
    res.send(html);
  } catch (_error: unknown) {
    res.status(500).json({ error: 'Failed to generate preview' });
  }
});

export default router;
