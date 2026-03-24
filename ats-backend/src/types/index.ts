/**
 * Comprehensive TypeScript type definitions for the ATS Resume Analyzer
 * This file serves as the single source of truth for all types used across the backend
 */

// ========================================
// API Response Types
// ========================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
}

// ========================================
// AI Model Types
// ========================================

export interface AIModel {
  id: string;
  name: string;
  provider: string;
  context_length: number;
  recommended?: boolean;
  supported_parameters: string[];
  per_request_limits?: {
    input_tokens?: number;
    output_tokens?: number;
  };
  pricing?: {
    prompt: string;
    completion: string;
  };
  created?: number;
  description: string;
  architecture?: {
    modality?: string;
    tokenizer?: string;
    instruct_type?: string;
  };
}

export interface ModelParameters {
  temperature?: number;
  max_tokens?: number;
  include_reasoning?: boolean;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  openrouter?: boolean;
  error?: string;
  models?: number;
}

// ========================================
// Resume Types
// ========================================

export interface CreateResumeInput {
  title: string;
  content?: string;
  file?: Express.Multer.File;
  structuredData?: string | Record<string, any>;
  templateId?: string | null;
}

export interface UpdateResumeInput {
  title?: string;
  content?: string;
  templateId?: string | null;
  structuredData?: string | Record<string, any> | null;
}

export interface ResumeFileMetadata {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
}

export interface ResumeData {
  id: string;
  title: string;
  content: string | null;
  extractedText: string | null;
  originalFileId: string | null;
  originalFileName: string | null;
  originalFileSize: number | null;
  originalFileType: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface ResumeResponse extends ResumeData {
  template?: {
    id: string;
    name: string;
  } | null;
}

// ========================================
// Analysis Types
// ========================================

export interface SkillsAnalysis {
  score: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  recommendations: string[];
}

export interface FormattingScore {
  score: number;
  issues: string[];
  suggestions: string[];
}

export interface FormattingAnalysis {
  detectedIssues: string[];
  formattingHints: string[];
}

export interface ExperienceRelevance {
  score: number;
  relevantExperience: string;
  gaps: string[];
}

export interface ModelUsed {
  id: string;
  name: string;
  provider: string;
}

export interface AnalysisResult {
  overallScore: number;
  skillsAnalysis: SkillsAnalysis;
  formattingScore: FormattingScore;
  experienceRelevance: ExperienceRelevance;
  actionableAdvice: string[];
  modelUsed: ModelUsed;
  processingTime?: number;
  tokensUsed?: number;
}

export interface AnalysisInput {
  resumeText: string;
  jobDescription: string;
  selectedModel?: string;
  modelParameters?: ModelParameters;
}

export interface AnalysisResponse {
  id: string;
  analysisType: string;
  aiProvider: string;
  modelUsed: string;
  status: string;
  createdAt: Date;
  completedAt: Date | null;
  processingTimeMs: number | null;
  tokensUsed: number | null;
  results: AnalysisResult | null;
  resume?: {
    id: string;
    title: string;
    createdAt: Date;
  };
  jobDescription?: {
    id: string;
    title: string;
    company: string | null;
  };
}

export interface AnalysisListResponse {
  id: string;
  analysisType: string;
  aiProvider: string | null;
  modelUsed: string | null;
  status: string;
  createdAt: Date;
  completedAt: Date | null;
  processingTimeMs: number | null;
  tokensUsed: number | null;
  resume?: {
    id: string;
    title: string;
    createdAt: Date;
  };
  jobDescription?: {
    id: string;
    title: string;
    company: string | null;
  };
  jobTitle?: string;
  overallScore: number | null;
  results: Record<string, any> | null;
}

// ========================================
// Job Description Types
// ========================================

export interface JobDescriptionPayload {
  title?: string;
  company?: string | null;
  location?: string | null;
  description?: string;
  sourceUrl?: string | null;
}

export interface JobDescriptionInput extends JobDescriptionPayload {
  userId: string;
}

export interface JobDescriptionResponse {
  id: string;
  userId: string;
  title: string;
  company: string | null;
  location: string | null;
  description: string;
  sourceUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

// ========================================
// File Processing Types
// ========================================

export interface FileExtractResult {
  text: string;
  mimeType: string;
  fileName: string;
}

export interface FileParsedData {
  data?: {
    text: string;
  };
  text?: string;
  value?: string;
}

export interface MammothResult {
  value: string;
  messages: string[];
}

// ========================================
// Request Body Types
// ========================================

export interface AnalyzeRequestBody {
  jobDescription: string;
  jobTitle?: string;
  selectedModel?: string;
  temperature?: number;
  max_tokens?: number;
  include_reasoning?: boolean | string;
}

export interface ResumeUpdateRequestBody {
  title?: string;
  content?: string;
  templateId?: string | null;
  structuredData?: string | Record<string, any> | null;
}

export interface ResumeAnalyzeRequestBody {
  jobDescription: string;
  jobTitle?: string;
  selectedModel?: string;
  temperature?: number;
  max_tokens?: number;
  include_reasoning?: boolean | string;
}

export interface ResumesPreviewRequestBody {
  content: Record<string, any>;
  templateId?: string;
}

export interface ResumesParseRequestBody {
  text: string;
}

// ========================================
// Completion Parameters Type
// ========================================

export interface CompletionParameters {
  model: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;
  temperature: number;
  max_tokens: number;
  seed: number;
  reasoning_effort?: 'low' | 'medium' | 'high';
}

// ========================================
// OpenAI Completion Response Types
// ========================================

export interface OpenAIChoice {
  message?: {
    content?: string;
  };
}

export interface OpenAICompletion {
  choices: OpenAIChoice[];
}

// ========================================
// Cache Types
// ========================================

export interface ModelCache {
  data: AIModel[];
  lastFetched: number | null;
  isLoading: boolean;
}

// ========================================
// User Types
// ========================================

export interface UserData {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  subscriptionTier: string;
}

export interface TokenPayload {
  userId: string;
  email: string;
}

// ========================================
// Error Types
// ========================================

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ForbiddenError';
  }
}

// ========================================
// Type Guards
// ========================================

export function isValidTemperature(value: any): value is number {
  return typeof value === 'number' && value >= 0 && value <= 2;
}

export function isValidMaxTokens(value: any): value is number {
  return typeof value === 'number' && value >= 500 && value <= 16000;
}

export function isAnalysisResult(value: any): value is AnalysisResult {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof value.overallScore === 'number' &&
    typeof value.skillsAnalysis === 'object' &&
    typeof value.formattingScore === 'object' &&
    typeof value.experienceRelevance === 'object' &&
    Array.isArray(value.actionableAdvice)
  );
}
