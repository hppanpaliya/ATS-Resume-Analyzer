import axios from 'axios';
import useAuthStore from '../stores/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.DEV ? 'http://localhost:3001' : (
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001'
  )
);

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

const isAuthRequest = (url = '') => (
  url.includes('/api/auth/login') ||
  url.includes('/api/auth/register') ||
  url.includes('/api/auth/refresh') ||
  url.includes('/api/auth/logout')
);

let refreshPromise = null;

const sleep = (ms) => new Promise((resolve) => window.setTimeout(resolve, ms));

const isTransientRefreshError = (error) => {
  const status = error?.response?.status;
  return !status || status >= 500;
};

const requestTokenRefresh = async (refreshToken) => {
  const maxAttempts = 2;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      return await axios.post(
        `${API_BASE_URL}/api/auth/refresh`,
        { refreshToken },
        { timeout: 10000 }
      );
    } catch (error) {
      if (attempt >= maxAttempts || !isTransientRefreshError(error)) {
        throw error;
      }

      await sleep(250 * attempt);
    }
  }

  throw new Error('Failed to refresh session');
};

// Request interceptor - add token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - handle token refresh
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config || {};

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isAuthRequest(originalRequest.url)) {
        return Promise.reject(error);
      }

      try {
        const refreshToken = useAuthStore.getState().refreshToken;

        if (!refreshToken) {
          throw new Error('Missing refresh token');
        }

        if (!refreshPromise) {
          refreshPromise = requestTokenRefresh(refreshToken);
        }

        const response = await refreshPromise;

        const tokens = response?.data?.data?.tokens;
        if (!tokens?.accessToken || !tokens?.refreshToken) {
          throw new Error('Invalid refresh response');
        }

        useAuthStore.getState().setAuth(
          useAuthStore.getState().user,
          tokens.accessToken,
          tokens.refreshToken
        );

        originalRequest.headers = {
          ...originalRequest.headers,
          Authorization: `Bearer ${tokens.accessToken}`,
        };

        return apiClient(originalRequest);
      } catch (refreshError) {
        const refreshStatus = refreshError?.response?.status;
        const shouldClearAuth =
          refreshError?.message === 'Missing refresh token' ||
          refreshError?.message === 'Invalid refresh response' ||
          refreshStatus === 400 ||
          refreshStatus === 401 ||
          refreshStatus === 403;

        if (shouldClearAuth) {
          useAuthStore.getState().clearAuth();
          // Only redirect to login if we're not already on the login page
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }

        return Promise.reject(refreshError);
      } finally {
        refreshPromise = null;
      }
    }

    console.error('API Response Error:', error);

    // Handle common error cases
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please check your connection and try again.');
    }

    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data;
      const requestUrl = error.config?.url || '';

      // Handle specific error codes with user-friendly messages
      switch (status) {
        case 400:
          throw new Error(data?.error || 'Invalid request. Please check your input.');
        case 401:
          if (requestUrl.includes('/api/auth/login')) {
            throw new Error('Invalid email or password. Please try again.');
          }
          throw new Error(data?.error || 'Authentication required. Please sign in again.');
        case 403:
          throw new Error('You don\'t have permission to access this resource.');
        case 404:
          throw new Error('The requested resource was not found.');
        case 409:
          if (requestUrl.includes('/api/auth/register')) {
            throw new Error(data?.error || 'An account with this email already exists.');
          }
          throw new Error('This item already exists.');
        case 422:
          throw new Error('Please check your input and try again.');
        case 429:
          throw new Error('Too many requests. Please wait a moment and try again.');
        case 500:
          throw new Error(data?.error || 'Server error. Please try again later.');
        case 503:
          throw new Error(data?.error || 'Service temporarily unavailable. Please try again shortly.');
        default:
          throw new Error(data?.error || `Something went wrong (${status}). Please try again.`);
      }
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('No response from server. Please check if the backend is running.');
    } else {
      // Something else happened
      throw new Error(`Request failed: ${error.message}`);
    }
  }
);

export const analyzeResume = async (resumeFile, jobDescription, selectedModel = null, modelParameters = {}, jobTitle = null) => {
  const formData = new FormData();
  formData.append('resume', resumeFile);
  formData.append('jobDescription', jobDescription);
  
  // Include job title if provided
  if (jobTitle) {
    formData.append('jobTitle', jobTitle);
  }
  
  // Include selected model if provided
  if (selectedModel) {
    formData.append('selectedModel', selectedModel);
  }

  // Include model parameters if provided
  if (modelParameters.temperature !== undefined) {
    formData.append('temperature', modelParameters.temperature);
  }
  if (modelParameters.max_tokens !== undefined) {
    formData.append('max_tokens', modelParameters.max_tokens);
  }
  if (modelParameters.include_reasoning !== undefined) {
    formData.append('include_reasoning', modelParameters.include_reasoning);
  }

  try {
    const response = await apiClient.post('/api/analyze', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 60000 // 60 seconds for analysis
    });
    return response.data.data; // Extract the actual data from the success response
  } catch (error) {
    throw error; // Re-throw to be handled by interceptor
  }
};

export const getAnalysisJobStatus = async (jobId) => {
  try {
    const response = await apiClient.get(`/api/analysis/${jobId}/status`);
    return response.data.data;
  } catch (error) {
    throw new Error(`Failed to fetch analysis status: ${error.message}`);
  }
};

export const waitForAnalysisCompletion = async (
  jobId,
  { intervalMs = 1500, timeoutMs = 120000 } = {}
) => {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const status = await getAnalysisJobStatus(jobId);

    if (status.state === 'completed') {
      return {
        ...status,
        result: status.result
          ? {
              ...status.result,
              savedAnalysisId: status.result.savedAnalysisId || status.result.analysisId || null,
            }
          : null,
      };
    }

    if (status.state === 'failed') {
      throw new Error(status.error || 'Analysis failed during processing.');
    }

    await new Promise((resolve) => window.setTimeout(resolve, intervalMs));
  }

  throw new Error('Analysis is taking longer than expected. Please check your history shortly.');
};

// Get available AI models from backend
export const getAvailableModels = async () => {
  try {
    const response = await apiClient.get('/api/models');
    return response.data.data; // Extract the data from the success response
  } catch (error) {
    console.error('Failed to fetch models:', error);
    throw new Error(`Failed to load AI models: ${error.message}`);
  }
};

// Refresh models cache
export const refreshModelsCache = async () => {
  try {
    const response = await apiClient.post('/api/models/refresh');
    return response.data;
  } catch (error) {
    console.error('Failed to refresh models cache:', error);
    throw new Error(`Failed to refresh models: ${error.message}`);
  }
};

// Analysis history operations
export const getAnalyses = async (page = 1, limit = 10) => {
  try {
    const response = await apiClient.get('/api/analyses', {
      params: { page, limit }
    });
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch analyses:', error);
    throw new Error(`Failed to load analyses: ${error.message}`);
  }
};

export const getAnalysisById = async (analysisId) => {
  try {
    const response = await apiClient.get(`/api/analyses/${analysisId}`);
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch analysis:', error);
    throw new Error(`Failed to load analysis: ${error.message}`);
  }
};

export const parseResumeText = async (text) => {
  try {
    const response = await apiClient.post('/api/resumes/parse', { text });
    return response.data.data;
  } catch (error) {
    throw new Error(`Failed to parse resume text: ${error.message}`);
  }
};

export const generateResumePreview = async (content, templateId = null) => {
  try {
    const response = await apiClient.post('/api/resumes/preview', {
      content,
      templateId,
    });

    return response.data;
  } catch (error) {
    throw new Error(`Failed to generate resume preview: ${error.message}`);
  }
};

export const exportResume = async (resumeId, format = 'pdf') => {
  const normalizedFormat = ['pdf', 'word'].includes(format) ? format : 'pdf';

  try {
    const response = await apiClient.get(`/api/resumes/${resumeId}/export/${normalizedFormat}`, {
      responseType: 'blob',
    });

    return response.data;
  } catch (error) {
    throw new Error(`Failed to export resume: ${error.message}`);
  }
};

export const analyzeStoredResume = async (
  resumeId,
  jobDescription,
  selectedModel = null,
  modelParameters = {},
  jobTitle = null
) => {
  try {
    const payload = {
      jobDescription,
      selectedModel,
      jobTitle,
      ...modelParameters,
    };

    const response = await apiClient.post(`/api/resumes/${resumeId}/analyze`, payload);
    return response.data.data;
  } catch (error) {
    throw new Error(`Failed to analyze resume: ${error.message}`);
  }
};

const normalizeJobDescriptionPayload = (jobData = {}) => {
  const normalizeNullableString = (value) => {
    if (value === undefined) {
      return undefined;
    }
    if (value === null) {
      return null;
    }
    if (typeof value !== 'string') {
      return value;
    }

    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  };

  return {
    title: typeof jobData.title === 'string' ? jobData.title.trim() : jobData.title,
    description: typeof jobData.description === 'string' ? jobData.description.trim() : jobData.description,
    company: normalizeNullableString(jobData.company),
    location: normalizeNullableString(jobData.location),
    sourceUrl: normalizeNullableString(jobData.sourceUrl),
  };
};

// Job description operations
export const getJobDescriptions = async () => {
  try {
    const response = await apiClient.get('/api/job-descriptions', {
      params: { page: 1, limit: 100 },
    });
    return response.data.data?.jobDescriptions || [];
  } catch (error) {
    console.error('Failed to fetch job descriptions:', error);
    throw new Error(`Failed to load job descriptions: ${error.message}`);
  }
};

export const createJobDescription = async (jobData) => {
  try {
    const payload = normalizeJobDescriptionPayload(jobData);
    const response = await apiClient.post('/api/job-descriptions', payload);
    return response.data.data;
  } catch (error) {
    console.error('Failed to create job description:', error);
    throw new Error(`Failed to create job description: ${error.message}`);
  }
};

export const updateJobDescription = async (jobId, updates) => {
  try {
    const payload = normalizeJobDescriptionPayload(updates);
    const response = await apiClient.put(`/api/job-descriptions/${jobId}`, payload);
    return response.data.data;
  } catch (error) {
    console.error('Failed to update job description:', error);
    throw new Error(`Failed to update job description: ${error.message}`);
  }
};

export const deleteJobDescription = async (jobId) => {
  try {
    const response = await apiClient.delete(`/api/job-descriptions/${jobId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to delete job description:', error);
    throw new Error(`Failed to delete job description: ${error.message}`);
  }
};

// Resume CRUD operations (updated to use PUT instead of PATCH)
export const getResumes = async (page = 1, limit = 10) => {
  try {
    const response = await apiClient.get('/api/resumes', {
      params: { page, limit }
    });
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch resumes:', error);
    throw new Error(`Failed to load resumes: ${error.message}`);
  }
};

export const createResume = async (title, content, templateId = null) => {
  try {
    const response = await apiClient.post('/api/resumes', {
      title,
      content,
      templateId
    });
    return response.data.data.resume;
  } catch (error) {
    console.error('Failed to create resume:', error);
    throw new Error(`Failed to create resume: ${error.message}`);
  }
};

export const createResumeFromFile = async (title, file, templateId = null) => {
  try {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('resume', file);
    if (templateId) {
      formData.append('templateId', templateId);
    }

    const response = await apiClient.post('/api/resumes', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data.resume;
  } catch (error) {
    console.error('Failed to create resume from file:', error);
    throw new Error(`Failed to create resume from file: ${error.message}`);
  }
};

export const createResumeFromStructuredData = async (title, structuredData, templateId = null) => {
  try {
    const response = await apiClient.post('/api/resumes', {
      title,
      structuredData: JSON.stringify(structuredData),
      templateId
    });
    return response.data.data.resume;
  } catch (error) {
    console.error('Failed to create resume from structured data:', error);
    throw new Error(`Failed to create resume from structured data: ${error.message}`);
  }
};

export const updateResume = async (resumeId, updates) => {
  try {
    const payload = {
      ...updates,
      templateId: updates?.templateId === '' ? null : updates?.templateId,
    };
    const response = await apiClient.put(`/api/resumes/${resumeId}`, payload);
    return response.data.data.resume;
  } catch (error) {
    console.error('Failed to update resume:', error);
    throw new Error(`Failed to update resume: ${error.message}`);
  }
};

export const getResumeById = async (resumeId) => {
  try {
    const response = await apiClient.get(`/api/resumes/${resumeId}`);
    return response.data.data.resume;
  } catch (error) {
    console.error('Failed to fetch resume:', error);
    throw new Error(`Failed to fetch resume: ${error.message}`);
  }
};

export const deleteResume = async (resumeId) => {
  try {
    const response = await apiClient.delete(`/api/resumes/${resumeId}`);
    return response.data;
  } catch (error) {
    console.error('Failed to delete resume:', error);
    throw new Error(`Failed to delete resume: ${error.message}`);
  }
};

// Health check endpoint
export const checkHealth = async () => {
  try {
    const response = await apiClient.get('/api/health');
    return response.data;
  } catch (error) {
    throw new Error('Backend service unavailable');
  }
};

// Resume file operations
export const downloadResumeFile = async (resumeId, filename) => {
  try {
    const response = await apiClient.get(`/api/resumes/${resumeId}/file`, {
      responseType: 'blob',
    });

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename || `resume-${resumeId}`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download resume file:', error);
    throw new Error(`Failed to download resume file: ${error.message}`);
  }
};

export const getResumeFileMetadata = async (resumeId) => {
  try {
    const response = await apiClient.get(`/api/resumes/${resumeId}/file/metadata`);
    return response.data.data;
  } catch (error) {
    console.error('Failed to get resume file metadata:', error);
    throw new Error(`Failed to get resume file metadata: ${error.message}`);
  }
};

// Template operations
export const getTemplates = async (category = null) => {
  try {
    const params = category ? { category } : {};
    const response = await apiClient.get('/api/templates', { params });
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch templates:', error);
    throw new Error(`Failed to load templates: ${error.message}`);
  }
};

export const getTemplateById = async (templateId) => {
  try {
    const response = await apiClient.get(`/api/templates/${templateId}`);
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch template:', error);
    throw new Error(`Failed to load template: ${error.message}`);
  }
};

// Test API connection
export const testConnection = async () => {
  const startTime = Date.now();
  const health = await checkHealth();
  const responseTime = Date.now() - startTime;

  return {
    success: true,
    responseTime,
    serverTime: health.timestamp,
    modelCache: health.modelCache,
  };
};

// Utility function to validate file before upload
export const validateFile = (file) => {
  const allowedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!file) {
    throw new Error('No file provided');
  }

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Invalid file type. Please upload a PDF or DOCX file.');
  }

  if (file.size > maxSize) {
    throw new Error('File size too large. Maximum size is 5MB.');
  }

  return true;
};

// Utility function to format model name for display
export const formatModelName = (modelId) => {
  if (!modelId) return 'Unknown Model';
  
  // Extract provider and model name from ID
  const parts = modelId.split('/');
  if (parts.length >= 2) {
    const provider = parts[0];
    const modelName = parts[1].replace(':free', '').replace('-', ' ');
    return `${provider}/${modelName}`;
  }
  
  return modelId;
};

// Export the axios instance as default for auth service
export default apiClient;
