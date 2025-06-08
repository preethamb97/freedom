// Analytics Service for Freedom - Encrypted Data Storage
import { 
  trackEvent, 
  trackUserEvent, 
  trackSecurityEvent, 
  trackEncryptionEvent, 
  trackDataEvent 
} from './firebase';

// User Journey Analytics
export const trackUserJourney = {
  // Landing page events
  landingPageView: () => {
    trackEvent('landing_page_view', {
      timestamp: new Date().toISOString(),
      journey_stage: 'awareness'
    });
  },

  signUpStart: () => {
    trackEvent('signup_started', {
      journey_stage: 'consideration',
      conversion_funnel: 'signup'
    });
  },

  signUpComplete: (userId) => {
    trackEvent('signup_completed', {
      user_id: userId,
      journey_stage: 'conversion',
      conversion_funnel: 'signup'
    });
  },

  firstEncryptionCreated: (userId) => {
    trackEvent('first_encryption_created', {
      user_id: userId,
      journey_stage: 'activation',
      milestone: 'first_encryption'
    });
  },

  firstDataStored: (userId, dataSize) => {
    trackEvent('first_data_stored', {
      user_id: userId,
      journey_stage: 'activation',
      milestone: 'first_data',
      data_size: dataSize
    });
  }
};

// Security Analytics
export const trackSecurity = {
  // Encryption events
  encryptionCreated: (keyLength, encryptionName) => {
    trackSecurityEvent('encryption_created', {
      key_length: keyLength,
      encryption_name_length: encryptionName?.length,
      encryption_type: 'AES-256-GCM'
    });
  },

  encryptionKeyGenerated: (keyLength) => {
    trackEncryptionEvent('key_generated', keyLength);
  },

  encryptionKeyManualEntry: (keyLength) => {
    trackEncryptionEvent('key_manual_entry', keyLength);
  },

  encryptionKeyValidationFailed: (reason) => {
    trackSecurityEvent('key_validation_failed', {
      failure_reason: reason,
      security_level: 'high'
    });
  },

  // Authentication security
  authenticationAttempt: (method) => {
    trackSecurityEvent('auth_attempt', {
      auth_method: method,
      timestamp: new Date().toISOString()
    });
  },

  authenticationSuccess: (userId, method, isNewUser) => {
    trackSecurityEvent('auth_success', {
      user_id: userId,
      auth_method: method,
      is_new_user: isNewUser,
      security_level: 'authenticated'
    });
  },

  authenticationFailure: (method, reason) => {
    trackSecurityEvent('auth_failure', {
      auth_method: method,
      failure_reason: reason,
      security_level: 'failed'
    });
  },

  // Rate limiting events
  rateLimitTriggered: (action, attemptCount) => {
    trackSecurityEvent('rate_limit_triggered', {
      protected_action: action,
      attempt_count: attemptCount,
      security_level: 'protection_active'
    });
  }
};

// Data Analytics
export const trackData = {
  // Data storage events
  dataEncrypted: (dataSize, encryptionId) => {
    trackDataEvent('data_encrypted', dataSize);
    trackEvent('data_storage_attempt', {
      encryption_id: encryptionId,
      data_size: dataSize,
      encryption_type: 'AES-256-GCM'
    });
  },

  dataDecrypted: (dataSize, encryptionId) => {
    trackDataEvent('data_decrypted', dataSize);
    trackEvent('data_retrieval_attempt', {
      encryption_id: encryptionId,
      data_size: dataSize
    });
  },

  dataViewed: (recordCount, encryptionId) => {
    trackEvent('data_viewed', {
      record_count: recordCount,
      encryption_id: encryptionId,
      view_type: 'paginated'
    });
  },

  bulkDataOperation: (operation, recordCount) => {
    trackEvent('bulk_data_operation', {
      operation_type: operation,
      record_count: recordCount
    });
  }
};

// Performance Analytics
export const trackPerformance = {
  // Page load metrics
  pageLoadTime: (page, loadTime) => {
    trackEvent('page_load_performance', {
      page_name: page,
      load_time_ms: loadTime,
      performance_category: loadTime < 2000 ? 'good' : loadTime < 4000 ? 'needs_improvement' : 'poor'
    });
  },

  // Encryption performance
  encryptionPerformance: (operation, duration, dataSize) => {
    trackEvent('encryption_performance', {
      operation_type: operation, // 'encrypt' or 'decrypt'
      duration_ms: duration,
      data_size: dataSize,
      performance_category: duration < 100 ? 'fast' : duration < 500 ? 'medium' : 'slow'
    });
  },

  // API response times
  apiResponseTime: (endpoint, duration, success) => {
    trackEvent('api_performance', {
      endpoint: endpoint,
      response_time_ms: duration,
      success: success,
      performance_category: duration < 500 ? 'fast' : duration < 2000 ? 'medium' : 'slow'
    });
  }
};

// User Engagement Analytics
export const trackEngagement = {
  // Feature usage
  featureUsed: (featureName, context = {}) => {
    trackEvent('feature_usage', {
      feature_name: featureName,
      usage_context: context,
      timestamp: new Date().toISOString()
    });
  },

  // Time spent tracking
  sessionDuration: (duration, pageViews) => {
    trackEvent('session_metrics', {
      session_duration_ms: duration,
      page_views: pageViews,
      engagement_level: duration > 300000 ? 'high' : duration > 60000 ? 'medium' : 'low'
    });
  },

  // UI interactions
  buttonClick: (buttonName, context) => {
    trackEvent('button_interaction', {
      button_name: buttonName,
      interaction_context: context,
      timestamp: new Date().toISOString()
    });
  },

  formInteraction: (formName, action, field = null) => {
    trackEvent('form_interaction', {
      form_name: formName,
      action: action, // 'start', 'complete', 'abandon', 'field_focus'
      field_name: field,
      timestamp: new Date().toISOString()
    });
  }
};

// Enhanced Error Analytics
export const trackErrors = {
  // Application errors
  jsError: (error, context) => {
    trackEvent('javascript_error', {
      error_message: error.message,
      error_stack: error.stack?.substring(0, 500), // Limit stack trace length
      error_context: JSON.stringify(context),
      timestamp: new Date().toISOString()
    });
  },

  // API errors
  apiError: (endpoint, statusCode, errorMessage) => {
    trackEvent('api_error', {
      endpoint: endpoint,
      status_code: statusCode,
      error_message: errorMessage,
      timestamp: new Date().toISOString()
    });
  },

  // Validation errors
  validationError: (field, errorType, value) => {
    trackEvent('validation_error', {
      field_name: field,
      error_type: errorType,
      value_length: value?.length,
      timestamp: new Date().toISOString()
    });
  },

  // Encryption errors
  encryptionError: (operation, errorMessage) => {
    trackEvent('encryption_error', {
      operation_type: operation,
      error_message: errorMessage,
      timestamp: new Date().toISOString()
    });
  },

  // App crash tracking
  appCrash: (crashDetails) => {
    trackEvent('app_crash', {
      ...crashDetails,
      timestamp: new Date().toISOString(),
      severity: 'critical',
      app_name: 'Freedom'
    });
  },

  // Error recovery tracking
  errorRecovery: (recoveryAction, errorId) => {
    trackEvent('error_recovery', {
      recovery_action: recoveryAction,
      error_id: errorId,
      timestamp: new Date().toISOString()
    });
  },

  // Unhandled promise rejection
  unhandledRejection: (reason, promise) => {
    trackEvent('unhandled_promise_rejection', {
      reason: reason?.toString()?.substring(0, 500),
      promise_type: promise?.constructor?.name || 'Unknown',
      timestamp: new Date().toISOString(),
      severity: 'high'
    });
  },

  // Global error handler
  globalError: (message, source, lineno, colno, error) => {
    trackEvent('global_error', {
      error_message: message,
      source_file: source,
      line_number: lineno,
      column_number: colno,
      error_stack: error?.stack?.substring(0, 500),
      timestamp: new Date().toISOString(),
      severity: 'high'
    });
  },

  // Network errors
  networkError: (url, status, statusText) => {
    trackEvent('network_error', {
      request_url: url,
      status_code: status,
      status_text: statusText,
      timestamp: new Date().toISOString()
    });
  },

  // Component mount errors
  componentError: (componentName, errorMessage, errorStack) => {
    trackEvent('component_error', {
      component_name: componentName,
      error_message: errorMessage,
      error_stack: errorStack?.substring(0, 500),
      timestamp: new Date().toISOString()
    });
  }
};

// Business Analytics
export const trackBusiness = {
  // Conversion funnel
  conversionStep: (step, success, userId = null) => {
    trackEvent('conversion_funnel', {
      funnel_step: step,
      step_success: success,
      user_id: userId,
      timestamp: new Date().toISOString()
    });
  },

  // Feature adoption
  featureAdoption: (featureName, userId, adoptionStage) => {
    trackEvent('feature_adoption', {
      feature_name: featureName,
      user_id: userId,
      adoption_stage: adoptionStage, // 'discovered', 'tried', 'adopted'
      timestamp: new Date().toISOString()
    });
  },

  // User retention
  userRetention: (userId, daysSinceFirstVisit, sessionCount) => {
    trackEvent('user_retention', {
      user_id: userId,
      days_since_first_visit: daysSinceFirstVisit,
      session_count: sessionCount,
      retention_category: daysSinceFirstVisit < 7 ? 'early' : daysSinceFirstVisit < 30 ? 'short_term' : 'long_term'
    });
  }
};

// Export all analytics functions
export default {
  trackUserJourney,
  trackSecurity,
  trackData,
  trackPerformance,
  trackEngagement,
  trackErrors,
  trackBusiness
}; 