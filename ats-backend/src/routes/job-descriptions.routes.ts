/**
 * Job Descriptions Routes
 * Handles CRUD operations for job descriptions
 */

import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth.middleware';
import { jobDescriptionsPerMonthLimiter } from '../middleware/rate-limiter.middleware';
import prisma from '../lib/prisma';
import {
  sanitizeJobTitle,
  sanitizeJobDescription,
  sanitizeCompanyName,
  sanitizeLocation,
} from '../utils/sanitizer';
import {
  parsePagination,
  buildPaginationMeta,
  validateSortField,
  validateSortOrder,
  type AnalysisFilterOptions,
} from '../utils/pagination';
import type { JobDescriptionPayload } from '../types/index';

const router: Router = Router();

/**
 * Standard error response helper
 */
const serverError = (res: Response, error: string) => {
  res.status(500).json({
    success: false,
    error,
  });
};

/**
 * Validates and normalizes job description payload
 * Performs sanitization and validation of all fields
 * @param body - Raw request body
 * @param requireCoreFields - If true, title and description are required
 * @returns Normalized job description payload
 * @throws Error if validation fails
 */
const normalizeJobDescriptionPayload = (body: any, requireCoreFields: boolean): JobDescriptionPayload => {
  const normalized: JobDescriptionPayload = {};

  if (body.title !== undefined) {
    if (typeof body.title !== 'string') {
      throw new Error('Title must be a string');
    }

    const title = sanitizeJobTitle(body.title);
    if (title.length < 2 || title.length > 200) {
      throw new Error('Title must be between 2 and 200 characters');
    }
    normalized.title = title;
  }

  if (body.description !== undefined) {
    if (typeof body.description !== 'string') {
      throw new Error('Description must be a string');
    }

    const description = sanitizeJobDescription(body.description);
    if (description.length < 30 || description.length > 20000) {
      throw new Error('Description must be between 30 and 20000 characters');
    }
    normalized.description = description;
  }

  if (body.company !== undefined) {
    if (body.company === null) {
      normalized.company = null;
    } else if (typeof body.company === 'string') {
      const company = sanitizeCompanyName(body.company);
      if (company.length > 200) {
        throw new Error('Company must be 200 characters or fewer');
      }
      normalized.company = company || null;
    } else {
      throw new Error('Company must be a string or null');
    }
  }

  if (body.location !== undefined) {
    if (body.location === null) {
      normalized.location = null;
    } else if (typeof body.location === 'string') {
      const location = sanitizeLocation(body.location);
      if (location.length > 200) {
        throw new Error('Location must be 200 characters or fewer');
      }
      normalized.location = location || null;
    } else {
      throw new Error('Location must be a string or null');
    }
  }

  if (body.sourceUrl !== undefined) {
    if (body.sourceUrl === null) {
      normalized.sourceUrl = null;
    } else if (typeof body.sourceUrl === 'string') {
      const sourceUrl = body.sourceUrl.trim();
      if (!sourceUrl) {
        normalized.sourceUrl = null;
      } else {
        if (sourceUrl.length > 2048) {
          throw new Error('Source URL must be 2048 characters or fewer');
        }

        try {
          const parsed = new URL(sourceUrl);
          if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
            throw new Error('Source URL must use HTTP or HTTPS');
          }
        } catch {
          throw new Error('Source URL must be a valid URL');
        }

        normalized.sourceUrl = sourceUrl;
      }
    } else {
      throw new Error('Source URL must be a string or null');
    }
  }

  if (requireCoreFields) {
    if (!normalized.title || !normalized.description) {
      throw new Error('Title and description are required');
    }
  } else if (Object.keys(normalized).length === 0) {
    throw new Error('At least one field is required to update');
  }

  return normalized;
};

/**
 * GET /api/job-descriptions - Get user's job descriptions
 * Returns paginated list of saved job descriptions
 * Query parameters:
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10, max: 100)
 * - search: Search in title, company, location, description
 * - sortBy: Sort field (createdAt|updatedAt, default: updatedAt)
 * - order: Sort order (asc|desc, default: desc)
 */
router.get('/job-descriptions', authMiddleware, async (req: AuthRequest, res: Response) => {
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
        const searchParam = req.query.search as string;
      const search = searchParam ? searchParam.trim().toLowerCase() : undefined;
        const sortBy = validateSortField(
            req.query.sortBy as string | undefined,
            ['createdAt', 'updatedAt'],
            'updatedAt'
        ) as 'createdAt' | 'updatedAt';
        const order = validateSortOrder(req.query.order as string | undefined);

        // Build where clause
        const where: any = {
            userId: req.userId,
            deletedAt: null,
        };

        if (search) {
            const searchTerm = search.trim();
            if (searchTerm.length > 0) {
                where.OR = [
                    { title: { contains: searchTerm, mode: 'insensitive' } },
                    { company: { contains: searchTerm, mode: 'insensitive' } },
                    { location: { contains: searchTerm, mode: 'insensitive' } },
                    { description: { contains: searchTerm, mode: 'insensitive' } },
                ];
            }
        }

        // Fetch job descriptions and total count
        const [jobDescriptions, totalCount] = await Promise.all([
            prisma.jobDescription.findMany({
                where,
                skip: pagination.offset,
                take: pagination.limit,
                orderBy: { [sortBy]: order },
            }),
            prisma.jobDescription.count({ where }),
        ]);

        const paginationMeta = buildPaginationMeta(
            pagination.page,
            pagination.limit,
            totalCount
        );

        res.json({
            success: true,
            data: {
                jobDescriptions,
                pagination: paginationMeta,
            }
        });
    } catch (_error: unknown) {
        serverError(res, 'Failed to fetch job descriptions');
    }
});

/**
 * POST /api/job-descriptions - Create new job description
 * Saves a job description for later use in analyses
 * Rate limited to prevent abuse
 */
router.post('/job-descriptions', authMiddleware, jobDescriptionsPerMonthLimiter, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.userId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        const payload = normalizeJobDescriptionPayload(req.body, true);

        const jobDescription = await prisma.jobDescription.create({
            data: {
                userId: req.userId,
                title: payload.title!,
                company: payload.company,
                location: payload.location,
                description: payload.description!,
                sourceUrl: payload.sourceUrl
            }
        });

        res.status(201).json({
            success: true,
            data: jobDescription
        });
    } catch (error: unknown) {
        const err = error as Error;
        if (err.message?.includes('must') || err.message?.includes('required') || err.message?.includes('between') || err.message?.includes('valid')) {
            return res.status(400).json({
                success: false,
                error: err.message
            });
        }

        serverError(res, 'Failed to create job description');
    }
});

/**
 * PUT /api/job-descriptions/:id - Update job description
 * Allows partial updates of job description fields
 */
router.put('/job-descriptions/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.userId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        const payload = normalizeJobDescriptionPayload(req.body, false);

        const jobDescription = await prisma.jobDescription.findFirst({
            where: {
                id: (req.params.id as string),
                userId: req.userId,
                deletedAt: null
            }
        });

        if (!jobDescription) {
            return res.status(404).json({
                success: false,
                error: 'Job description not found'
            });
        }

        const updatedJobDescription = await prisma.jobDescription.update({
            where: { id: (req.params.id as string) },
            data: {
                ...payload,
            }
        });

        res.json({
            success: true,
            data: updatedJobDescription
        });
    } catch (error: unknown) {
        const err = error as Error;
        if (err.message?.includes('must') || err.message?.includes('required') || err.message?.includes('between') || err.message?.includes('valid') || err.message?.includes('At least one field')) {
            return res.status(400).json({
                success: false,
                error: err.message
            });
        }

        serverError(res, 'Failed to update job description');
    }
});

/**
 * DELETE /api/job-descriptions/:id - Delete job description
 * Soft deletes job description (sets deletedAt timestamp)
 */
router.delete('/job-descriptions/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
    try {
        if (!req.userId) {
            return res.status(401).json({
                success: false,
                error: 'Authentication required'
            });
        }

        const jobDescription = await prisma.jobDescription.findFirst({
            where: {
                id: (req.params.id as string),
                userId: req.userId,
                deletedAt: null
            }
        });

        if (!jobDescription) {
            return res.status(404).json({
                success: false,
                error: 'Job description not found'
            });
        }

        await prisma.jobDescription.update({
            where: { id: (req.params.id as string) },
            data: { deletedAt: new Date() }
        });

        res.json({
            success: true,
            message: 'Job description deleted successfully'
        });
    } catch (_error: unknown) {
        serverError(res, 'Failed to delete job description');
    }
});

export default router;
