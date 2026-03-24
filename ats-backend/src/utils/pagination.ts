/**
 * Pagination and Filtering Utilities
 * Provides helpers for implementing pagination, search, and advanced filtering
 */

/**
 * Pagination parameters extracted from query strings
 */
export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
  cursor?: string;
}

/**
 * Paginated response metadata
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  offset: number;
  cursor?: string;
}

/**
 * Generic paginated response wrapper
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

/**
 * Resume filtering options
 */
export interface ResumeFilterOptions {
  status?: 'draft' | 'published';
  templateId?: string;
  search?: string; // Search in title and extractedText
  sortBy?: 'createdAt' | 'updatedAt' | 'title';
  order?: 'asc' | 'desc';
}

/**
 * Analysis filtering options
 */
export interface AnalysisFilterOptions {
  status?: 'pending' | 'completed' | 'failed';
  resumeId?: string;
  jobDescriptionId?: string;
  fromDate?: Date;
  toDate?: Date;
  sortBy?: 'createdAt' | 'completedAt';
  order?: 'asc' | 'desc';
}

/**
 * Parse pagination parameters from query object
 * Validates and normalizes page and limit values
 *
 * @param page - Page number (1-indexed)
 * @param limit - Items per page
 * @param maxLimit - Maximum allowed limit (default 100)
 * @returns Normalized pagination parameters
 *
 * @example
 * ```
 * const params = parsePagination(req.query.page, req.query.limit);
 * // Returns: { page: 1, limit: 10, offset: 0 }
 * ```
 */
export function parsePagination(
  page?: string | number,
  limit?: string | number,
  maxLimit = 100
): PaginationParams {
  const pageParam = Number.parseInt(String(page ?? ''), 10);
  const limitParam = Number.parseInt(String(limit ?? ''), 10);

  const normalizedPage = Number.isFinite(pageParam) && pageParam > 0 ? pageParam : 1;
  const normalizedLimit = Number.isFinite(limitParam) && limitParam > 0
    ? Math.min(limitParam, maxLimit)
    : 10;

  const offset = (normalizedPage - 1) * normalizedLimit;

  return {
    page: normalizedPage,
    limit: normalizedLimit,
    offset,
  };
}

/**
 * Build pagination metadata for response
 *
 * @param page - Current page number
 * @param limit - Items per page
 * @param totalCount - Total number of items
 * @returns Pagination metadata
 */
export function buildPaginationMeta(
  page: number,
  limit: number,
  totalCount: number
): PaginationMeta {
  const totalPages = Math.ceil(totalCount / limit);
  const offset = (page - 1) * limit;

  return {
    page,
    limit,
    totalCount,
    totalPages,
    offset,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}

/**
 * Cursor-based pagination - generates a cursor from an item
 * Useful for stable pagination when items are being added/removed
 *
 * @param id - The item's unique identifier
 * @param sortValue - The value used for sorting (createdAt, etc.)
 * @returns Base64-encoded cursor
 */
export function encodeCursor(id: string, sortValue: Date | string): string {
  const sortTimestamp = sortValue instanceof Date ? sortValue.getTime() : sortValue;
  const cursorData = JSON.stringify({ id, sort: sortTimestamp });
  return Buffer.from(cursorData).toString('base64');
}

/**
 * Decode a cursor for cursor-based pagination
 *
 * @param cursor - Base64-encoded cursor
 * @returns Decoded cursor data
 */
export function decodeCursor(cursor: string): { id: string; sort: number } | null {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Build Prisma where clause for resume filtering
 *
 * @param userId - User ID (required)
 * @param filters - Filter options
 * @returns Prisma where clause object
 */
export function buildResumeWhereClause(
  userId: string,
  filters?: ResumeFilterOptions
): any {
  const where: any = {
    userId,
    deletedAt: null,
  };

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.templateId) {
    where.templateId = filters.templateId;
  }

  // Search in title or extractedText
  // Note: SQLite does not support mode: 'insensitive' in Prisma.
  // SQLite's LIKE is case-insensitive for ASCII by default.
  if (filters?.search) {
    const searchTerm = filters.search.trim();
    if (searchTerm.length > 0) {
      where.OR = [
        { title: { contains: searchTerm } },
        { extractedText: { contains: searchTerm } },
      ];
    }
  }

  return where;
}

/**
 * Build Prisma orderBy clause for resumes
 *
 * @param sortBy - Field to sort by
 * @param order - Sort direction
 * @returns Prisma orderBy object
 */
export function buildResumeOrderBy(
  sortBy: 'createdAt' | 'updatedAt' | 'title' = 'updatedAt',
  order: 'asc' | 'desc' = 'desc'
): any {
  return {
    [sortBy]: order,
  };
}

/**
 * Build Prisma where clause for analysis filtering
 *
 * @param userId - User ID (required)
 * @param filters - Filter options
 * @returns Prisma where clause object
 */
export function buildAnalysisWhereClause(
  userId: string,
  filters?: AnalysisFilterOptions
): any {
  const where: any = {
    userId,
  };

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.resumeId) {
    where.resumeId = filters.resumeId;
  }

  if (filters?.jobDescriptionId) {
    where.jobDescriptionId = filters.jobDescriptionId;
  }

  // Date range filtering
  if (filters?.fromDate || filters?.toDate) {
    where.createdAt = {};
    if (filters.fromDate) {
      where.createdAt.gte = filters.fromDate;
    }
    if (filters.toDate) {
      where.createdAt.lte = filters.toDate;
    }
  }

  return where;
}

/**
 * Build Prisma orderBy clause for analyses
 *
 * @param sortBy - Field to sort by
 * @param order - Sort direction
 * @returns Prisma orderBy object
 */
export function buildAnalysisOrderBy(
  sortBy: 'createdAt' | 'completedAt' = 'createdAt',
  order: 'asc' | 'desc' = 'desc'
): any {
  return {
    [sortBy]: order,
  };
}

/**
 * Parse date from ISO string or timestamp
 *
 * @param dateStr - Date string (ISO format or timestamp)
 * @returns Date object or null if invalid
 */
export function parseDate(dateStr?: string | number): Date | null {
  if (!dateStr) return null;

  try {
    const parsed = typeof dateStr === 'string' ? new Date(dateStr) : new Date(dateStr);
    return parsed.getTime() > 0 ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Validate sort field is allowed
 *
 * @param sortBy - Sort field name
 * @param allowedFields - List of allowed fields
 * @returns Normalized sort field
 */
export function validateSortField<T extends string>(
  sortBy: string | undefined,
  allowedFields: T[],
  defaultField: T
): T {
  if (!sortBy || !allowedFields.includes(sortBy as T)) {
    return defaultField;
  }
  return sortBy as T;
}

/**
 * Validate sort order
 *
 * @param order - Sort order ('asc' or 'desc')
 * @returns Normalized sort order
 */
export function validateSortOrder(order?: string): 'asc' | 'desc' {
  return order === 'asc' ? 'asc' : 'desc';
}

/**
 * Format resume for list response (compact view)
 */
export function formatResumeForList(resume: any) {
  const previewText = (resume.content || resume.extractedText || '').trim();

  return {
    id: resume.id,
    title: resume.title,
    status: resume.status,
    templateId: resume.templateId,
    templateName: resume.template?.name,
    previewText,
    createdAt: resume.createdAt,
    updatedAt: resume.updatedAt,
    hasFile: !!resume.originalFileId,
    originalFileId: resume.originalFileId,
    originalFileName: resume.originalFileName,
    fileName: resume.originalFileName,
    fileSize: resume.originalFileSize,
  };
}

/**
 * Format analysis for list response (compact view)
 */
export function formatAnalysisForList(analysis: any) {
  return {
    id: analysis.id,
    status: analysis.status,
    analysisType: analysis.analysisType,
    modelUsed: analysis.modelUsed,
    resumeId: analysis.resume?.id,
    resumeTitle: analysis.resume?.title,
    jobDescriptionId: analysis.jobDescription?.id,
    jobTitle: analysis.jobDescription?.title,
    createdAt: analysis.createdAt,
    completedAt: analysis.completedAt,
    processingTimeMs: analysis.processingTimeMs,
  };
}
