import axios from 'axios';
import useAuthStore from '../stores/authStore';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - add token
apiClient.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    // console.log('Access token from store:', token ? 'present' : 'null/undefined');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      // console.log('Authorization header set');
    } else {
      // console.log('No token available, request will be unauthenticated');
    }
    // console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
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
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        const response = await apiClient.post('/api/auth/refresh', {
          refreshToken,
        });

        const { tokens } = response.data.data;
        useAuthStore.getState().setAuth(
          useAuthStore.getState().user,
          tokens.accessToken,
          tokens.refreshToken
        );

        originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        useAuthStore.getState().clearAuth();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    console.error('API Response Error:', error);

    // Handle common error cases
    if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout. Please check your connection and try again.');
    }

    if (error.response) {
      // Server responded with error status
      const message = error.response.data?.error || error.response.data?.message || 'Server error occurred';
      throw new Error(message);
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

// Job description operations
export const getJobDescriptions = async () => {
  try {
    const response = await apiClient.get('/api/job-descriptions');
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch job descriptions:', error);
    throw new Error(`Failed to load job descriptions: ${error.message}`);
  }
};

export const createJobDescription = async (jobData) => {
  try {
    const response = await apiClient.post('/api/job-descriptions', jobData);
    return response.data.data;
  } catch (error) {
    console.error('Failed to create job description:', error);
    throw new Error(`Failed to create job description: ${error.message}`);
  }
};

export const updateJobDescription = async (jobId, updates) => {
  try {
    const response = await apiClient.put(`/api/job-descriptions/${jobId}`, updates);
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
    const response = await apiClient.put(`/api/resumes/${resumeId}`, updates);
    return response.data.data;
  } catch (error) {
    console.error('Failed to update resume:', error);
    throw new Error(`Failed to update resume: ${error.message}`);
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
    const response = await apiClient.get('/health');
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
  try {
    const startTime = Date.now();
    const health = await checkHealth();
    const responseTime = Date.now() - startTime;
    
    return {
      success: true,
      responseTime,
      serverTime: health.timestamp,
      modelCache: health.modelCache
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
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

