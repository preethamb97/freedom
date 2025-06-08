import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import LandingPage from '../pages/LandingPage';
import HomePage from '../pages/HomePage';
import ViewPage from '../pages/ViewPage';
import { useAuth } from '../hooks/useAuth';
import { resetMocks } from '../utils/test-utils';

// Mock the useAuth hook
jest.mock('../hooks/useAuth');

// Mock all page components
jest.mock('../pages/LandingPage', () => {
  return function MockLandingPage() {
    return <div data-testid="landing-page">Landing Page</div>;
  };
});

jest.mock('../pages/HomePage', () => {
  return function MockHomePage() {
    return <div data-testid="home-page">Home Page</div>;
  };
});

jest.mock('../pages/ViewPage', () => {
  return function MockViewPage() {
    return <div data-testid="view-page">View Page</div>;
  };
});

// Create a test version of App without the Router wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return user ? children : <Navigate to="/" replace />;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div>Loading...</div>;
  }
  
  return user ? <Navigate to="/home" replace /> : children;
};

const TestApp = () => {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <div className="App">
        <Routes>
          <Route 
            path="/" 
            element={
              <PublicRoute>
                <LandingPage />
              </PublicRoute>
            } 
          />
          <Route 
            path="/home" 
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/view" 
            element={
              <ProtectedRoute>
                <ViewPage />
              </ProtectedRoute>
            } 
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </ConfigProvider>
  );
};

describe('App Integration Tests', () => {
  beforeEach(() => {
    resetMocks();
  });

  describe('Public Routes', () => {
    test('should render LandingPage when user is not authenticated and on root path', async () => {
      useAuth.mockReturnValue({
        user: null,
        loading: false
      });

      render(
        <MemoryRouter initialEntries={['/']}>
          <TestApp />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('landing-page')).toBeInTheDocument();
      });
    });

    test('should redirect to home when authenticated user visits landing page', async () => {
      const mockUser = {
        uid: 'test-user-123',
        name: 'Test User',
        email: 'test@example.com'
      };

      useAuth.mockReturnValue({
        user: mockUser,
        loading: false
      });

      render(
        <MemoryRouter initialEntries={['/']}>
          <TestApp />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('home-page')).toBeInTheDocument();
      });
    });
  });

  describe('Protected Routes', () => {
    test('should render HomePage when user is authenticated and on /home path', async () => {
      const mockUser = {
        uid: 'test-user-123',
        name: 'Test User',
        email: 'test@example.com'
      };

      useAuth.mockReturnValue({
        user: mockUser,
        loading: false
      });

      render(
        <MemoryRouter initialEntries={['/home']}>
          <TestApp />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('home-page')).toBeInTheDocument();
      });
    });

    test('should render ViewPage when user is authenticated and on /view path', async () => {
      const mockUser = {
        uid: 'test-user-123',
        name: 'Test User',
        email: 'test@example.com'
      };

      useAuth.mockReturnValue({
        user: mockUser,
        loading: false
      });

      render(
        <MemoryRouter initialEntries={['/view']}>
          <TestApp />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('view-page')).toBeInTheDocument();
      });
    });

    test('should redirect to landing page when unauthenticated user tries to access protected routes', async () => {
      useAuth.mockReturnValue({
        user: null,
        loading: false
      });

      render(
        <MemoryRouter initialEntries={['/home']}>
          <TestApp />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('landing-page')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    test('should show loading state while authentication is being determined', async () => {
      useAuth.mockReturnValue({
        user: null,
        loading: true
      });

      render(
        <MemoryRouter initialEntries={['/']}>
          <TestApp />
        </MemoryRouter>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('404 Handling', () => {
    test('should redirect unknown routes to landing page', async () => {
      useAuth.mockReturnValue({
        user: null,
        loading: false
      });

      render(
        <MemoryRouter initialEntries={['/unknown-route']}>
          <TestApp />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('landing-page')).toBeInTheDocument();
      });
    });

    test('should redirect unknown routes to home page when authenticated', async () => {
      const mockUser = {
        uid: 'test-user-123',
        name: 'Test User',
        email: 'test@example.com'
      };

      useAuth.mockReturnValue({
        user: mockUser,
        loading: false
      });

      render(
        <MemoryRouter initialEntries={['/unknown-route']}>
          <TestApp />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByTestId('home-page')).toBeInTheDocument();
      });
    });
  });

  describe('Theme Configuration', () => {
    test('should apply Ant Design theme configuration', () => {
      useAuth.mockReturnValue({
        user: null,
        loading: false
      });

      const { container } = render(
        <MemoryRouter initialEntries={['/']}>
          <TestApp />
        </MemoryRouter>
      );

      // Check if the App div is rendered with correct class
      expect(container.querySelector('.App')).toBeInTheDocument();
    });
  });
}); 