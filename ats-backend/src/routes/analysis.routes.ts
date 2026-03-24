/**
 * AI Analysis Routes
 * Handles resume analysis job queueing, status tracking, and historical analysis retrieval
 */

import { Router, Request, Response } from 'express';
import multer from 'multer';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { analysesPerDayLimiter } from '../middleware/rate-limiter.middleware';
import prisma from '../lib/prisma';
import { safeJsonParse } from '../lib/json';
import {
  parsePagination,
  buildPaginationMeta,
  buildAnalysisWhereClause,
  buildAnalysisOrderBy,
  validateSortField,
  validateSortOrder,
  parseDate,
  formatAnalysisForList,
  type AnalysisFilterOptions,
} from '../utils/pagination';
import { queueAnalysisJob, getJobStatus, getQueueStats } from '../queues/analysis.queue';
import type {
  AnalyzeRequestBody,
  ApiResponse,
} from '../types/index';
import { Logger } from '../utils/logger';
import { sanitizeJobDescription, sanitizeJobTitle } from '../utils/sanitizer';

const router: Router = Router();

/**
 * Admin authorization helper
 */
const requireAdmin = async (req: AuthRequest, res: Response) => {
  if (!req.userId) {
    res.status(401).json({ success: false, error: 'Authentication required' });
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { subscriptionTier: true },
  });

  if (!user || user.subscriptionTier !== 'admin') {
    res.status(403).json({ success: false, error: 'Admin access required' });
    return null;
  }

  return user;
};

/**
 * Standard error response helper
 */
const serverError = (res: Response, error: string) => {
  res.status(500).json({
    success: false,
    error,
  });
};

// Configure multer for file uploads (store in memory)
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    },
    fileFilter: (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
        const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF and DOCX are allowed.'));
        }
    }
});

/**
 * POST /api/analyze - Queue resume analysis job (async)
 * Accepts a resume file and job description, queues analysis job
 * Returns immediately with job ID for polling
 * 
 * Request body:
 * - resume: File upload
 * - jobDescription: Job description text (min 30 chars)
 * - jobTitle: Optional job title
 * - selectedModel: Optional model ID to use
 * - temperature: Optional temperature parameter (0-2)
 * - max_tokens: Optional max tokens (500-16000)
 * - include_reasoning: Optional boolean
 */
router.post('/analyze', authMiddleware, analysesPerDayLimiter, upload.single('resume'), async (req: AuthRequest & { file?: Express.Multer.File }, res: Response) => {
    try {
        if (!req.userId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'No file uploaded'
            });
        }

        const body = req.body as AnalyzeRequestBody;
        const jobDescription = typeof body.jobDescription === 'string'
            ? sanitizeJobDescription(body.jobDescription).trim()
            : '';
        const jobTitle = typeof body.jobTitle === 'string' && body.jobTitle.trim().length > 0
            ? sanitizeJobTitle(body.jobTitle)
            : 'Untitled Job';
        const selectedModel = typeof body.selectedModel === 'string' ? body.selectedModel : undefined;

        const temperatureParam = Number.parseFloat(String(body.temperature ?? ''));
        const maxTokensParam = Number.parseInt(String(body.max_tokens ?? ''), 10);
        const temperature = Number.isFinite(temperatureParam)
            ? Math.min(Math.max(temperatureParam, 0), 2)
            : undefined;
        const maxTokens = Number.isFinite(maxTokensParam)
            ? Math.min(Math.max(maxTokensParam, 500), 16000)
            : undefined;

        if (!jobDescription || jobDescription.length < 30) {
            return res.status(400).json({
                success: false,
                error: 'Job description must be at least 30 characters'
            });
        }

        if (jobDescription.length > 15000) {
            return res.status(400).json({
                success: false,
                error: 'Job description is too long (maximum 15,000 characters)'
            });
        }

        // Basic file validation
        if (req.file.size === 0) {
            return res.status(400).json({
                success: false,
                error: 'Uploaded file is empty'
            });
        }

        const validMimeTypes = [
            'application/pdf',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        if (!validMimeTypes.includes(req.file.mimetype)) {
            return res.status(400).json({
                success: false,
                error: 'Unsupported file type. Only PDF and DOCX are allowed.'
            });
        }

        // Queue the analysis job instead of processing synchronously
        const job = await queueAnalysisJob({
            userId: req.userId!,
            resumeText: '',
            jobDescription,
            jobTitle,
            fileBuffer: req.file.buffer,
            fileName: req.file.originalname,
            fileMimeType: req.file.mimetype,
            selectedModel,
            temperature,
            max_tokens: maxTokens,
            include_reasoning: body.include_reasoning === 'true' || body.include_reasoning === true
        });

        Logger.info(`Analysis job queued for user ${req.userId}: ${job.id}`);

        res.status(202).json({
            success: true,
            message: 'Analysis queued successfully',
            data: {
                jobId: job.id,
                status: 'queued'
            }
        });

    } catch (error: unknown) {
        const err = error instanceof Error ? error.message : 'Unknown error';
        Logger.error('Failed to queue analysis:', new Error(err));
        serverError(res, 'Failed to queue analysis: ' + err);
    }
});

/**
 * GET /api/analyses - Get user's analysis history
 * Query parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10, max: 100)
 * - status: Filter by status (pending|completed|failed)
 * - resumeId: Filter by resume ID
 * - jobDescriptionId: Filter by job description ID
 * - fromDate: Start date for range filter (ISO format)
 * - toDate: End date for range filter (ISO format)
 * - sortBy: Sort field (createdAt|completedAt, default: createdAt)
 * - order: Sort order (asc|desc, default: desc)
 */
router.get('/analyses', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.userId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        const pagination = parsePagination(
            req.query.page as string | number | undefined,
            req.query.limit as string | number | undefined
        );

        // Build filter options
        const filters: AnalysisFilterOptions = {
            status: req.query.status as 'pending' | 'completed' | 'failed' | undefined,
            resumeId: req.query.resumeId as string | undefined,
            jobDescriptionId: req.query.jobDescriptionId as string | undefined,
            fromDate: parseDate(req.query.fromDate as string | undefined) || undefined,
            toDate: parseDate(req.query.toDate as string | undefined) || undefined,
            sortBy: validateSortField(
                req.query.sortBy as string | undefined,
                ['createdAt', 'completedAt'],
                'createdAt'
            ) as 'createdAt' | 'completedAt',
            order: validateSortOrder(req.query.order as string | undefined),
        };

        // Build where clause
        const where = buildAnalysisWhereClause(req.userId, filters);
        const orderBy = buildAnalysisOrderBy(filters.sortBy, filters.order);

        // Fetch analyses and total count
        const [analyses, totalCount] = await Promise.all([
            prisma.analysis.findMany({
                where,
                include: {
                    resume: {
                        select: { id: true, title: true, createdAt: true }
                    },
                    jobDescription: {
                        select: { id: true, title: true, company: true }
                    }
                },
                orderBy,
                skip: pagination.offset,
                take: pagination.limit
            }),
            prisma.analysis.count({ where })
        ]);

        const paginationMeta = buildPaginationMeta(
            pagination.page,
            pagination.limit,
            totalCount
        );

        // Format analyses for response
        const formattedAnalyses = analyses.map(analysis => {
            const parsedResults = safeJsonParse<Record<string, any> | null>(analysis.results, null);
            return {
                ...formatAnalysisForList(analysis),
                overallScore: parsedResults?.overallScore || parsedResults?.overall_match_score || null,
                analysisType: analysis.analysisType,
                aiProvider: analysis.aiProvider,
                modelUsed: analysis.modelUsed,
                tokensUsed: analysis.tokensUsed,
                results: parsedResults
            };
        });

        res.json({
            success: true,
            data: {
                analyses: formattedAnalyses,
                pagination: paginationMeta,
            }
        });
    } catch (_error: unknown) {
        serverError(res, 'Failed to fetch analyses');
    }
});

/**
 * GET /api/analyses/:id - Get specific analysis details
 * Returns full analysis results including resume and job description
 */
router.get('/analyses/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.userId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        const analysis = await prisma.analysis.findFirst({
            where: {
                id: (req.params.id as string),
                userId: req.userId
            },
            include: {
                resume: {
                    select: { 
                        id: true, 
                        title: true, 
                        content: true, 
                        createdAt: true,
                        originalFileName: true,
                        originalFileId: true
                    }
                },
                jobDescription: {
                    select: { id: true, title: true, company: true, description: true }
                }
            }
        });

        if (!analysis) {
            return res.status(404).json({
                success: false,
                error: 'Analysis not found'
            });
        }

        const parsedResults = safeJsonParse<Record<string, any> | null>(analysis.results, null);

        res.json({
            success: true,
            data: {
                id: analysis.id,
                analysisType: analysis.analysisType,
                aiProvider: analysis.aiProvider,
                modelUsed: analysis.modelUsed,
                status: analysis.status,
                createdAt: analysis.createdAt,
                completedAt: analysis.completedAt,
                processingTimeMs: analysis.processingTimeMs,
                tokensUsed: analysis.tokensUsed,
                resume: analysis.resume,
                jobDescription: analysis.jobDescription,
                jobTitle: analysis.jobDescription?.title || 'Untitled Analysis',
                overallScore: parsedResults?.overallScore || parsedResults?.overall_match_score || null,
                ...parsedResults
            }
        });
    } catch (_error: unknown) {
        serverError(res, 'Failed to fetch analysis');
    }
});

/**
 * GET /api/analysis/:jobId/status - Get job status and progress
 * Polls for job status during async analysis processing
 */
router.get('/analysis/:jobId/status', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.userId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        const { jobId } = req.params;

        const jobStatus = await getJobStatus(jobId as string);

        if (!jobStatus) {
            return res.status(404).json({
                success: false,
                error: 'Job not found'
            });
        }

        // Verify job belongs to current user
        if (jobStatus.data?.userId !== req.userId) {
            return res.status(403).json({
                success: false,
                error: 'Unauthorized'
            });
        }

        res.json({
            success: true,
            data: {
                jobId: jobStatus.id,
                state: jobStatus.state,
                progress: jobStatus.progress,
                result: jobStatus.result,
                error: jobStatus.failedReason,
                attempt: jobStatus.attempt,
                startedAt: jobStatus.startedAt,
                finishedAt: jobStatus.finishedAt
            }
        });

    } catch (_error: unknown) {
        serverError(res, 'Failed to fetch job status');
    }
});

/**
 * GET /api/queue/stats - Get queue statistics (admin only)
 * Returns statistics about the analysis queue and processing
 */
router.get('/queue/stats', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        const adminUser = await requireAdmin(req, res);
        if (!adminUser) {
            return;
        }

        const stats = await getQueueStats();

        res.json({
            success: true,
            data: stats
        });

    } catch (_error: unknown) {
        serverError(res, 'Failed to fetch queue statistics');
    }
});

export default router;
