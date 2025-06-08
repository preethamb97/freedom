// Global Error Handler for Freedom App
import { trackErrors } from '../services/analytics';

// Global error handler for unhandled JavaScript errors
export const setupGlobalErrorHandlers = () => {
  // Handle unhandled JavaScript errors
  window.addEventListener('error', (event) => {
    const { message, filename, lineno, colno, error } = event;
    
    console.error('Global Error:', {
      message,
      filename,
      lineno,
      colno,
      error
    });

    // Track error with analytics
    trackErrors.globalError(message, filename, lineno, colno, error);
  });

  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled Promise Rejection:', event.reason);
    
    // Track promise rejection with analytics
    trackErrors.unhandledRejection(event.reason, event.promise);
    
    // Prevent the error from appearing in console (optional)
    // event.preventDefault();
  });

  // Handle network errors and fetch failures
  const originalFetch = window.fetch;
  window.fetch = async (...args) => {
    try {
      const response = await originalFetch(...args);
      
      // Track network errors for failed requests
      if (!response.ok) {
        trackErrors.networkError(
          args[0], 
          response.status, 
          response.statusText
        );
      }
      
      return response;
    } catch (error) {
      // Track network errors for failed fetch requests
      trackErrors.networkError(
        args[0], 
        0, 
        error.message
      );
      
      throw error;
    }
  };

  console.log('Freedom: Global error handlers initialized');
};

// Error wrapper for async functions
export const withErrorHandler = (asyncFunction, context = {}) => {
  return async (...args) => {
    try {
      return await asyncFunction(...args);
    } catch (error) {
      console.error('Async Error:', error);
      
      // Track the error
      trackErrors.jsError(error, {
        context: context,
        function_name: asyncFunction.name,
        arguments_count: args.length
      });
      
      // Re-throw the error to maintain normal error flow
      throw error;
    }
  };
};

// Error wrapper for React component methods
export const withComponentErrorHandler = (componentMethod, componentName) => {
  return function(...args) {
    try {
      return componentMethod.apply(this, args);
    } catch (error) {
      console.error(`Component Error in ${componentName}:`, error);
      
      // Track component error
      trackErrors.componentError(
        componentName,
        error.message,
        error.stack
      );
      
      // Re-throw the error to be caught by error boundary
      throw error;
    }
  };
};

// Safe execution wrapper that doesn't throw
export const safeExecute = (func, fallback = null, context = {}) => {
  try {
    return func();
  } catch (error) {
    console.warn('Safe Execution Error:', error);
    
    // Track the error but don't re-throw
    trackErrors.jsError(error, {
      context: context,
      safe_execution: true,
      fallback_used: fallback !== null
    });
    
    return fallback;
  }
};

// Safe async execution wrapper
export const safeAsyncExecute = async (asyncFunc, fallback = null, context = {}) => {
  try {
    return await asyncFunc();
  } catch (error) {
    console.warn('Safe Async Execution Error:', error);
    
    // Track the error but don't re-throw
    trackErrors.jsError(error, {
      context: context,
      safe_async_execution: true,
      fallback_used: fallback !== null
    });
    
    return fallback;
  }
};

// Create error reporting function for manual error reporting
export const reportError = (error, context = {}) => {
  console.error('Manual Error Report:', error);
  
  trackErrors.jsError(error, {
    manual_report: true,
    context: context,
    timestamp: new Date().toISOString()
  });
};

// Recovery helpers
export const errorRecovery = {
  // Reload current page
  reloadPage: () => {
    trackErrors.errorRecovery('page_reload');
    window.location.reload();
  },
  
  // Navigate to home
  goHome: () => {
    trackErrors.errorRecovery('navigate_home');
    window.location.href = '/';
  },
  
  // Clear local storage and reload
  clearStorageAndReload: () => {
    trackErrors.errorRecovery('clear_storage_reload');
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  },
  
  // Reset to fresh state
  resetApp: () => {
    trackErrors.errorRecovery('reset_app');
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/';
  }
};

// Performance monitoring for error-prone operations
export const withPerformanceMonitoring = (operation, operationName) => {
  return async (...args) => {
    const startTime = performance.now();
    
    try {
      const result = await operation(...args);
      const duration = performance.now() - startTime;
      
      // Track successful operation performance
      trackErrors.jsError(new Error('Performance tracking'), {
        operation_name: operationName,
        duration_ms: duration,
        success: true,
        performance_tracking: true
      });
      
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      
      // Track failed operation performance
      trackErrors.jsError(error, {
        operation_name: operationName,
        duration_ms: duration,
        success: false,
        performance_tracking: true
      });
      
      throw error;
    }
  };
};

export default {
  setupGlobalErrorHandlers,
  withErrorHandler,
  withComponentErrorHandler,
  safeExecute,
  safeAsyncExecute,
  reportError,
  errorRecovery,
  withPerformanceMonitoring
}; 