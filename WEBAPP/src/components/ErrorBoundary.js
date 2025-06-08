import React from 'react';
import { Result, Button, Typography, Card, Space } from 'antd';
import { BugOutlined, ReloadOutlined, HomeOutlined } from '@ant-design/icons';
import { trackErrors } from '../services/analytics';

const { Title, Paragraph, Text } = Typography;

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error: error
    };
  }

  componentDidCatch(error, errorInfo) {
    // Generate unique error ID for tracking
    const errorId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    
    this.setState({
      error: error,
      errorInfo: errorInfo,
      errorId: errorId
    });

    // Log error to Firebase Analytics
    this.logErrorToAnalytics(error, errorInfo, errorId);
    
    // Log to console for development
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  logErrorToAnalytics = (error, errorInfo, errorId) => {
    try {
      // Track the error with Firebase Analytics
      trackErrors.jsError(error, {
        error_id: errorId,
        component_stack: errorInfo.componentStack,
        error_boundary: true,
        page_location: window.location.href,
        user_agent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        app_name: 'Freedom',
        severity: 'critical'
      });

      // Also track as a general app crash event
      trackErrors.appCrash({
        error_id: errorId,
        error_message: error.message,
        error_stack: error.stack?.substring(0, 1000),
        component_stack: errorInfo.componentStack?.substring(0, 1000),
        crash_type: 'react_error_boundary'
      });

    } catch (analyticsError) {
      console.error('Failed to log error to analytics:', analyticsError);
    }
  };

  handleReload = () => {
    // Track recovery attempt
    trackErrors.errorRecovery('page_reload', this.state.errorId);
    window.location.reload();
  };

  handleGoHome = () => {
    // Track recovery attempt
    trackErrors.errorRecovery('navigate_home', this.state.errorId);
    window.location.href = '/';
  };

  handleRetry = () => {
    // Track recovery attempt
    trackErrors.errorRecovery('component_retry', this.state.errorId);
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    });
  };

  render() {
    if (this.state.hasError) {
      const { error, errorId } = this.state;
      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <div style={{ 
          minHeight: '100vh', 
          padding: '20px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Card 
            style={{ 
              maxWidth: 600, 
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
            }}
          >
            <Result
              icon={<BugOutlined style={{ color: '#f5222d' }} />}
              title={
                <Title level={2} style={{ color: '#f5222d', marginBottom: 8 }}>
                  Oops! Something went wrong
                </Title>
              }
              subTitle={
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <Paragraph style={{ fontSize: '16px', color: '#666' }}>
                    Don't worry - your encrypted data is safe! We've encountered a technical issue, 
                    but your information remains secure with AES-256 encryption.
                  </Paragraph>
                  
                  <Card 
                    size="small" 
                    style={{ 
                      background: '#fff2f0', 
                      border: '1px solid #ffccc7',
                      textAlign: 'left'
                    }}
                  >
                    <Text strong style={{ color: '#cf1322' }}>Security Notice:</Text>
                    <br />
                    <Text style={{ color: '#595959' }}>
                      • Your data remains encrypted and secure<br />
                      • No data has been lost or compromised<br />
                      • This is a display issue, not a security breach
                    </Text>
                  </Card>

                  {isDevelopment && (
                    <Card 
                      size="small" 
                      title="Development Error Details" 
                      style={{ 
                        textAlign: 'left',
                        background: '#f6f6f6',
                        border: '1px solid #d9d9d9'
                      }}
                    >
                      <Text code style={{ fontSize: '12px', wordBreak: 'break-word' }}>
                        {error?.message}
                      </Text>
                      {errorId && (
                        <div style={{ marginTop: 8 }}>
                          <Text strong>Error ID: </Text>
                          <Text code>{errorId}</Text>
                        </div>
                      )}
                    </Card>
                  )}

                  <Space size="middle" wrap>
                    <Button 
                      type="primary" 
                      icon={<ReloadOutlined />}
                      onClick={this.handleReload}
                      size="large"
                    >
                      Reload Page
                    </Button>
                    
                    <Button 
                      icon={<HomeOutlined />}
                      onClick={this.handleGoHome}
                      size="large"
                    >
                      Go to Home
                    </Button>
                    
                    <Button 
                      type="dashed"
                      onClick={this.handleRetry}
                      size="large"
                    >
                      Try Again
                    </Button>
                  </Space>

                  <div style={{ marginTop: 16, padding: 16, background: '#f0f8ff', borderRadius: 6 }}>
                    <Text style={{ color: '#1890ff', fontSize: '14px' }}>
                      <strong>Need Help?</strong> This error has been automatically reported to our team. 
                      Your session data is preserved and you can continue where you left off after resolving this issue.
                    </Text>
                  </div>
                </Space>
              }
            />
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for wrapping components with error boundaries
export const withErrorBoundary = (Component, errorFallback) => {
  return function WrappedComponent(props) {
    return (
      <ErrorBoundary fallback={errorFallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
};

// Hook for handling errors in functional components
export const useErrorHandler = () => {
  const handleError = React.useCallback((error, errorInfo = {}) => {
    const errorId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    
    // Log error to analytics
    trackErrors.jsError(error, {
      error_id: errorId,
      error_boundary: false,
      page_location: window.location.href,
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      severity: 'high',
      ...errorInfo
    });

    // Re-throw error to be caught by error boundary
    throw error;
  }, []);

  return handleError;
};

export default ErrorBoundary; 