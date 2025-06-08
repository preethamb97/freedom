import axios from 'axios';
import { trackErrors, trackPerformance } from '../services/analytics';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token and tracking
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add request tracking
    config.metadata = { startTime: performance.now() };
    
    return config;
  },
  (error) => {
    // Track request setup errors
    trackErrors.apiError('request_setup', 0, error.message);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling and performance tracking
api.interceptors.response.use(
  (response) => {
    // Track successful API calls
    const duration = performance.now() - response.config.metadata.startTime;
    trackPerformance.apiResponseTime(
      response.config.url, 
      duration, 
      true
    );
    
    return response;
  },
  (error) => {
    const config = error.config;
    const duration = config?.metadata?.startTime ? 
      performance.now() - config.metadata.startTime : 0;
    
    // Track API errors
    trackErrors.apiError(
      config?.url || 'unknown',
      error.response?.status || 0,
      error.message
    );
    
    // Track failed API performance
    trackPerformance.apiResponseTime(
      config?.url || 'unknown',
      duration,
      false
    );
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      // Unauthorized - clear token and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    
    // Handle network errors
    if (!error.response) {
      trackErrors.networkError(
        config?.url || 'unknown',
        0,
        'Network Error'
      );
    }
    
    return Promise.reject(error);
  }
);

// Retry mechanism for failed requests
const retryFailedRequest = async (requestFn, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      // Don't retry on client errors (4xx) except 429 (rate limit)
      if (error.response?.status >= 400 && 
          error.response?.status < 500 && 
          error.response?.status !== 429) {
        throw error;
      }
      
      if (attempt === maxRetries) {
        trackErrors.apiError('max_retries_exceeded', error.response?.status || 0, error.message);
        break;
      }
      
      // Wait before retrying with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
      
      trackErrors.apiError(`retry_attempt_${attempt}`, error.response?.status || 0, error.message);
    }
  }
  
  throw lastError;
};

// Safe API call wrapper
const safeApiCall = async (requestFn, fallback = null) => {
  try {
    return await requestFn();
  } catch (error) {
    console.error('Safe API call failed:', error);
    
    trackErrors.apiError('safe_call_failed', error.response?.status || 0, error.message);
    
    return fallback;
  }
};

// Auth API
export const authAPI = {
  googleLogin: (idToken) => retryFailedRequest(() => 
    api.post('/auth/google', { token: idToken })
  ),
  
  getProfile: () => retryFailedRequest(() => 
    api.get('/auth/profile')
  ),
  
  updateProfile: (profileData) => retryFailedRequest(() => 
    api.put('/auth/profile', profileData)
  ),
};

// Encryption API
export const encryptionAPI = {
  create: (encryptionData) => retryFailedRequest(() => 
    api.post('/encryption', encryptionData)
  ),
  
  getAll: () => retryFailedRequest(() => 
    api.get('/encryption')
  ),
  
  verifyKey: (encryptionId, keyData) => retryFailedRequest(() => 
    api.post(`/encryption/${encryptionId}/verify-key`, keyData)
  ),
  
  delete: (encryptionId) => retryFailedRequest(() => 
    api.delete(`/encryption/${encryptionId}`)
  ),
};

// Data API
export const dataAPI = {
  store: (dataPayload) => retryFailedRequest(() => 
    api.post('/data', dataPayload)
  ),
  
  retrieve: (encryptionId, params = {}) => retryFailedRequest(() => 
    api.get(`/data/${encryptionId}`, { params })
  ),
  
  delete: (dataId) => retryFailedRequest(() => 
    api.delete(`/data/${dataId}`)
  ),
  
  bulkDelete: (dataIds) => retryFailedRequest(() => 
    api.post('/data/bulk-delete', { dataIds })
  ),
};

// Health API
export const healthAPI = {
  check: () => safeApiCall(() => 
    api.get('/health'), 
    { data: { status: 'unknown' } }
  ),
  
  detailed: () => safeApiCall(() => 
    api.get('/health/detailed'),
    { data: { status: 'unknown', details: {} } }
  ),
};

// Generic API call with error handling
export const apiCall = async (method, url, data = null, config = {}) => {
  try {
    const response = await retryFailedRequest(() => {
      switch (method.toLowerCase()) {
        case 'get':
          return api.get(url, config);
        case 'post':
          return api.post(url, data, config);
        case 'put':
          return api.put(url, data, config);
        case 'patch':
          return api.patch(url, data, config);
        case 'delete':
          return api.delete(url, config);
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }
    });
    
    return response;
  } catch (error) {
    // Enhanced error information
    const enhancedError = {
      ...error,
      apiMethod: method,
      apiUrl: url,
      apiData: data,
      timestamp: new Date().toISOString(),
    };
    
    throw enhancedError;
  }
};

// Upload file with progress tracking
export const uploadFile = async (file, onProgress = null) => {
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });
    
    return response;
  } catch (error) {
    trackErrors.apiError('file_upload', error.response?.status || 0, error.message);
    throw error;
  }
};

// Batch API calls with error handling
export const batchApiCalls = async (requests) => {
  const results = [];
  const errors = [];
  
  for (const [index, request] of requests.entries()) {
    try {
      const result = await apiCall(
        request.method,
        request.url,
        request.data,
        request.config
      );
      results[index] = result;
    } catch (error) {
      errors[index] = error;
      results[index] = null;
      
      trackErrors.apiError(
        `batch_request_${index}`,
        error.response?.status || 0,
        error.message
      );
    }
  }
  
  return { results, errors };
};

// Connection status monitoring
export const connectionMonitor = {
  isOnline: () => navigator.onLine,
  
  checkConnection: async () => {
    try {
      await healthAPI.check();
      return true;
    } catch (error) {
      return false;
    }
  },
  
  setupConnectionListeners: (onOnline, onOffline) => {
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  },
};

export default api; 