import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
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
    return response.data;
  } catch (error) {
    throw error; // Re-throw to be handled by interceptor
  }
};

// Get available AI models from backend
export const getAvailableModels = async () => {
  try {
    const response = await apiClient.get('/api/models');
    return response.data;
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

