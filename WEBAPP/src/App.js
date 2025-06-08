import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import LandingPage from './pages/LandingPage';
import HomePage from './pages/HomePage';
import ViewPage from './pages/ViewPage';
import { useAuth, AuthProvider } from './hooks/useAuth';
import { updateMetaTags, initializeAnalytics } from './utils/seoHelpers';
import { setupGlobalErrorHandlers } from './utils/errorHandler';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

// Component to handle dynamic page titles and analytics
const PageTitle = () => {
  const location = useLocation();
  const { user } = useAuth();
  
  useEffect(() => {
    const getPageFromPath = (pathname) => {
      switch (pathname) {
        case '/':
          return 'home';
        case '/home':
          return 'dashboard';
        case '/view':
          return 'view';
        default:
          return 'home';
      }
    };
    
    const page = getPageFromPath(location.pathname);
    
    // Update meta tags and track page view
    updateMetaTags(page, {
      userId: user?.id,
      source: new URLSearchParams(location.search).get('utm_source') || 'direct'
    });
    
  }, [location, user]);
  
  return null;
};

// Analytics initialization component
const AnalyticsInitializer = () => {
  const { user } = useAuth();
  
  useEffect(() => {
    initializeAnalytics(user?.id);
  }, [user]);
  
  return null;
};

// Global error handler initialization
const ErrorHandlerInitializer = () => {
  useEffect(() => {
    setupGlobalErrorHandlers();
  }, []);
  
  return null;
};

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ 
          background: 'white', 
          padding: '40px', 
          borderRadius: '8px',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          Loading Freedom...
        </div>
      </div>
    );
  }
  
  return user ? children : <Navigate to="/" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      }}>
        <div style={{ 
          background: 'white', 
          padding: '40px', 
          borderRadius: '8px',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
        }}>
          Loading Freedom...
        </div>
      </div>
    );
  }
  
  return user ? <Navigate to="/home" replace /> : children;
};

const AppContent = () => {
  return (
    <Router>
      <ErrorHandlerInitializer />
      <AnalyticsInitializer />
      <PageTitle />
      <div className="App">
        <Routes>
          <Route 
            path="/" 
            element={
              <PublicRoute>
                <ErrorBoundary>
                <LandingPage />
                </ErrorBoundary>
              </PublicRoute>
            } 
          />
          <Route 
            path="/home" 
            element={
              <ProtectedRoute>
                <ErrorBoundary>
                <HomePage />
                </ErrorBoundary>
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/view" 
            element={
              <ProtectedRoute>
                <ErrorBoundary>
                <ViewPage />
                </ErrorBoundary>
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
};

function App() {
  return (
    <ErrorBoundary>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ConfigProvider>
    </ErrorBoundary>
  );
}

export default App; 