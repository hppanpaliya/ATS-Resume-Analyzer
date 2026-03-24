/**
 * PAGINATION UTILITIES - USAGE EXAMPLES
 * 
 * This file demonstrates how to use the pagination utilities
 * in your route handlers and services.
 * 
 * DO NOT COMMIT THIS FILE - It's documentation only.
 */

// ============================================
// EXAMPLE 1: Basic Resume Listing with Filters
// ============================================

import {
  parsePagination,
  buildPaginationMeta,
  buildResumeWhereClause,
  buildResumeOrderBy,
  validateSortField,
  validateSortOrder,
  type ResumeFilterOptions,
} from '../utils/pagination';
import prisma from '../lib/prisma';

// In your route handler:
async function listResumesExample(req: any, res: any) {
  try {
    // Parse pagination parameters
    const pagination = parsePagination(req.query.page, req.query.limit);

    // Build filter options with validation
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

    // Build Prisma query clauses
    const where = buildResumeWhereClause(req.userId, filters);
    const orderBy = buildResumeOrderBy(filters.sortBy, filters.order);

    // Execute query
    const [resumes, totalCount] = await Promise.all([
      prisma.resume.findMany({
        where,
        skip: pagination.offset,
        take: pagination.limit,
        orderBy,
        select: {
          id: true,
          title: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.resume.count({ where }),
    ]);

    // Build response with pagination metadata
    const paginationMeta = buildPaginationMeta(
      pagination.page,
      pagination.limit,
      totalCount
    );

    res.json({
      success: true,
      data: {
        resumes,
        pagination: paginationMeta,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch resumes' });
  }
}

// ============================================
// EXAMPLE 2: Analyses Listing with Date Range
// ============================================

import {
  buildAnalysisWhereClause,
  buildAnalysisOrderBy,
  parseDate,
  type AnalysisFilterOptions,
} from '../utils/pagination';

async function listAnalysesExample(req: any, res: any) {
  try {
    const pagination = parsePagination(req.query.page, req.query.limit);

    // Parse date parameters safely
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

    const where = buildAnalysisWhereClause(req.userId, filters);
    const orderBy = buildAnalysisOrderBy(filters.sortBy, filters.order);

    const [analyses, totalCount] = await Promise.all([
      prisma.analysis.findMany({
        where,
        skip: pagination.offset,
        take: pagination.limit,
        orderBy,
        include: {
          resume: { select: { id: true, title: true } },
          jobDescription: { select: { id: true, title: true } },
        },
      }),
      prisma.analysis.count({ where }),
    ]);

    const paginationMeta = buildPaginationMeta(
      pagination.page,
      pagination.limit,
      totalCount
    );

    res.json({
      success: true,
      data: {
        analyses,
        pagination: paginationMeta,
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch analyses' });
  }
}

// ============================================
// EXAMPLE 3: Service Layer Implementation
// ============================================

export class ResumeService {
  async searchResumesAdvanced(
    userId: string,
    filters?: ResumeFilterOptions,
    page = 1,
    limit = 10
  ) {
    const pagination = { page, limit, offset: (page - 1) * limit };
    const where = buildResumeWhereClause(userId, filters);
    const orderBy = buildResumeOrderBy(filters?.sortBy, filters?.order);

    const [resumes, totalCount] = await Promise.all([
      prisma.resume.findMany({
        where,
        skip: pagination.offset,
        take: pagination.limit,
        orderBy,
        include: { template: true },
      }),
      prisma.resume.count({ where }),
    ]);

    return {
      resumes,
      pagination: buildPaginationMeta(page, limit, totalCount),
    };
  }
}

// ============================================
// EXAMPLE 4: Frontend React Hook Usage
// ============================================

// hooks/useResumePagination.ts
import { useState, useCallback } from 'react';
import { api } from '../services/api';
import type { ResumeFilterOptions } from '../types';

export function useResumePagination() {
  const [resumes, setResumes] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<ResumeFilterOptions>({
    sortBy: 'updatedAt',
    order: 'desc',
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  const loadResumes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', String(limit));

      if (filters.status) params.append('status', filters.status);
      if (filters.search) params.append('search', filters.search);
      if (filters.templateId) params.append('templateId', filters.templateId);
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.order) params.append('order', filters.order);

      const response = await api.get(`/api/resumes?${params}`);
      setResumes(response.data.resumes);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to load resumes:', error);
    } finally {
      setLoading(false);
    }
  }, [page, limit, filters]);

  const handleSearch = useCallback((search: string) => {
    setFilters(prev => ({ ...prev, search }));
    setPage(1); // Reset to first page
  }, []);

  const handleStatusFilter = useCallback((status: 'draft' | 'published' | undefined) => {
    setFilters(prev => ({ ...prev, status }));
    setPage(1);
  }, []);

  const handleSort = useCallback((sortBy: string, order: 'asc' | 'desc') => {
    setFilters(prev => ({ ...prev, sortBy: sortBy as any, order }));
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const handleLimitChange = useCallback((newLimit: number) => {
    setLimit(newLimit);
    setPage(1); // Reset to first page when changing limit
  }, []);

  return {
    resumes,
    pagination,
    loading,
    filters,
    page,
    limit,
    loadResumes,
    handleSearch,
    handleStatusFilter,
    handleSort,
    handlePageChange,
    handleLimitChange,
  };
}

// Usage in component:
function ResumesPage() {
  const {
    resumes,
    pagination,
    loading,
    handleSearch,
    handlePageChange,
    handleSort,
    loadResumes,
  } = useResumePagination();

  useEffect(() => {
    loadResumes();
  }, [loadResumes]);

  return (
    <div>
      <SearchBar onSearch={handleSearch} />
      <ResumesList resumes={resumes} />
      {pagination && (
        <Pagination
          current={pagination.page}
          total={pagination.totalPages}
          onChange={handlePageChange}
          hasNextPage={pagination.hasNextPage}
          hasPreviousPage={pagination.hasPreviousPage}
        />
      )}
    </div>
  );
}

// ============================================
// EXAMPLE 5: Advanced Search with Multiple Filters
// ============================================

async function advancedSearchExample(req: any, res: any) {
  try {
    const { userId } = req;
    const pagination = parsePagination(req.query.page, req.query.limit);

    // Complex filter combination
    const filters: ResumeFilterOptions = {
      search: req.query.search, // "python developer"
      status: req.query.status, // "draft"
      templateId: req.query.templateId, // specific template
      sortBy: req.query.sortBy || 'updatedAt',
      order: req.query.order || 'desc',
    };

    const where = buildResumeWhereClause(userId, filters);
    const orderBy = buildResumeOrderBy(filters.sortBy, filters.order);

    // Add custom where clauses if needed
    if (req.query.minSize || req.query.maxSize) {
      where.originalFileSize = {};
      if (req.query.minSize) {
        where.originalFileSize.gte = parseInt(req.query.minSize);
      }
      if (req.query.maxSize) {
        where.originalFileSize.lte = parseInt(req.query.maxSize);
      }
    }

    const [resumes, totalCount] = await Promise.all([
      prisma.resume.findMany({
        where,
        skip: pagination.offset,
        take: pagination.limit,
        orderBy,
        include: {
          template: { select: { id: true, name: true } },
          analyses: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: { id: true, status: true, results: true },
          },
        },
      }),
      prisma.resume.count({ where }),
    ]);

    res.json({
      success: true,
      data: {
        resumes: resumes.map(resume => ({
          ...resume,
          lastAnalysis: resume.analyses[0] || null,
        })),
        pagination: buildPaginationMeta(pagination.page, pagination.limit, totalCount),
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Advanced search failed' });
  }
}

// Example query:
// GET /api/resumes?search=python&status=draft&sortBy=updatedAt&order=desc&minSize=10000&maxSize=500000

// ============================================
// EXAMPLE 6: Date Range Analysis Filtering
// ============================================

async function analyticsReportExample(req: any, res: any) {
  try {
    const pagination = parsePagination(req.query.page, 50); // Larger page for reports

    const fromDate = parseDate(req.query.fromDate);
    const toDate = parseDate(req.query.toDate);

    if (!fromDate || !toDate) {
      return res.status(400).json({ error: 'fromDate and toDate are required' });
    }

    const filters: AnalysisFilterOptions = {
      status: 'completed',
      fromDate,
      toDate,
      sortBy: 'completedAt',
      order: 'desc',
    };

    const where = buildAnalysisWhereClause(req.userId, filters);
    const orderBy = buildAnalysisOrderBy(filters.sortBy, filters.order);

    const [analyses, totalCount] = await Promise.all([
      prisma.analysis.findMany({
        where,
        skip: pagination.offset,
        take: pagination.limit,
        orderBy,
        include: {
          resume: { select: { id: true, title: true } },
          jobDescription: { select: { id: true, title: true } },
        },
      }),
      prisma.analysis.count({ where }),
    ]);

    // Calculate statistics
    const avgProcessingTime = analyses.reduce((sum, a) => sum + (a.processingTimeMs || 0), 0) / analyses.length;
    const avgTokensUsed = analyses.reduce((sum, a) => sum + (a.tokensUsed || 0), 0) / analyses.length;

    res.json({
      success: true,
      data: {
        analyses,
        pagination: buildPaginationMeta(pagination.page, pagination.limit, totalCount),
        stats: {
          avgProcessingTime,
          avgTokensUsed,
          totalAnalysesInPeriod: totalCount,
        },
      },
    });
  } catch (error) {
    res.status(500).json({ error: 'Report generation failed' });
  }
}

// Example query:
// GET /api/analyses/report?fromDate=2024-03-01&toDate=2024-03-31&page=1&limit=50
