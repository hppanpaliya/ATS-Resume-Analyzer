import axios from 'axios';
import useAuthStore from '../stores/authStore';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

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
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
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
        const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
          refreshToken,
        });

        const { accessToken } = response.data.data;
        useAuthStore.getState().setAuth(
          useAuthStore.getState().user,
          accessToken,
          refreshToken
        );

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
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

export const analyzeResume = async (resumeFile, jobDescription, selectedModel = null) => {
  const formData = new FormData();
  formData.append('resume', resumeFile);
  formData.append('jobDescription', jobDescription);
  
  // Include selected model if provided
  if (selectedModel) {
    formData.append('model', selectedModel);
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

// Resume CRUD operations
export const getResumes = async (page = 1, limit = 10, status) => {
  try {
    const params = { page, limit };
    if (status) params.status = status;
    
    const response = await apiClient.get('/api/resumes', { params });
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch resumes:', error);
    throw new Error(`Failed to load resumes: ${error.message}`);
  }
};

export const getResumeById = async (resumeId) => {
  try {
    const response = await apiClient.get(`/api/resumes/${resumeId}`);
    return response.data.data;
  } catch (error) {
    console.error('Failed to fetch resume:', error);
    throw new Error(`Failed to load resume: ${error.message}`);
  }
};

export const createResume = async (title, content, templateId) => {
  try {
    const response = await apiClient.post('/api/resumes', {
      title,
      content,
      templateId
    });
    return response.data.data;
  } catch (error) {
    console.error('Failed to create resume:', error);
    throw new Error(`Failed to create resume: ${error.message}`);
  }
};

export const updateResume = async (resumeId, updates) => {
  try {
    const response = await apiClient.patch(`/api/resumes/${resumeId}`, updates);
    return response.data.data;
  } catch (error) {
    console.error('Failed to update resume:', error);
    throw new Error(`Failed to update resume: ${error.message}`);
  }
};

export const deleteResume = async (resumeId) => {
  try {
    const response = await apiClient.delete(`/api/resumes/${resumeId}`);
    return response.data.data;
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

