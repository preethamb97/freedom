/**
 * Response utilities for consistent API responses
 */

const CORS_ORIGIN = '*';

const createResponseHeaders = (additionalHeaders = {}) => {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': CORS_ORIGIN,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    ...additionalHeaders
  };
};

export const sendResponse = (statusCode, data, additionalHeaders = {}) => {
  const headers = createResponseHeaders(additionalHeaders);
  return new Response(JSON.stringify(data), {
    status: statusCode,
    headers
  });
};

export const sendSuccess = (data, statusCode = 200, additionalHeaders = {}) => {
  return sendResponse(statusCode, {
    success: true,
    ...data
  }, additionalHeaders);
};

export const sendError = (message, statusCode = 500, additionalData = {}, additionalHeaders = {}) => {
  return sendResponse(statusCode, {
    success: false,
    message,
    ...additionalData
  }, additionalHeaders);
};

export const sendValidationError = (message, errors = {}) => {
  return sendError(message, 400, { errors });
};

export const sendAuthError = (message = 'Authentication required') => {
  return sendError(message, 401);
};

export const sendForbiddenError = (message = 'Access forbidden') => {
  return sendError(message, 403);
};

export const sendNotFoundError = (message = 'Resource not found') => {
  return sendError(message, 404);
};

export const sendServerError = (message = 'Internal server error') => {
  return sendError(message, 500);
};

export const sendSuccessCreate = (message, data, statusCode = 201) => {
  return sendResponse(statusCode, {
    success: true,
    message,
    data
  });
};

// Lazy load service to avoid circular dependencies
export const getEncryptionService = async () => {
  // Use mock service if available (for testing)
  if (global.mockEncryptionService) {
    return global.mockEncryptionService;
  }
  
  const encryptionService = await import('../services/encryptionService.js');
  return encryptionService;
};

// Wrapper for controllers to ensure they return Response objects
export const wrapController = (controllerFn) => {
  return async (req, res) => {
    try {
      const result = await controllerFn(req, res);
      // If the controller returned a Response object, return it
      if (result instanceof Response) {
        return result;
      }
      // If no result, assume the controller called res methods and return undefined
      // This will be handled by the calling code
      return undefined;
    } catch (error) {
      console.error('Controller error:', error);
      return sendServerError('An unexpected error occurred');
    }
  };
};

// Create a mock response object that returns Response objects
export const createMockResponse = () => {
  return {
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      return sendResponse(this.statusCode || 200, data);
    },
    statusCode: 200
  };
}; 