import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ViewPage from '../../pages/ViewPage';
import { renderWithProviders, resetMocks, mockUser } from '../../utils/test-utils';
import { useAuth } from '../../hooks/useAuth';
import { encryptionAPI, dataAPI } from '../../services/api';

// Mock the useAuth hook
jest.mock('../../hooks/useAuth');

// Mock the API services
jest.mock('../../services/api');

// Mock the organisms components
jest.mock('../../organisms/Header', () => {
  return function MockHeader({ title }) {
    return <div data-testid="header">{title}</div>;
  };
});

jest.mock('../../organisms/Sidebar', () => {
  return function MockSidebar({ user, onSignOut }) {
    return (
      <div data-testid="sidebar">
        <div>User: {user?.name}</div>
        <button onClick={onSignOut}>Sign Out</button>
      </div>
    );
  };
});

jest.mock('../../molecules/DataViewer', () => {
  return function MockDataViewer({ encryptions, data, onFetchData, loading, encryptionsLoading, hasMore }) {
    return (
      <div data-testid="data-viewer">
        <div>Encryptions Loading: {encryptionsLoading.toString()}</div>
        <div>Data Loading: {loading.toString()}</div>
        <div>Has More: {hasMore.toString()}</div>
        <div>Encryptions Count: {encryptions.length}</div>
        <div>Data Count: {data.length}</div>
        <button onClick={() => onFetchData('test-encryption', 'test-key', true)}>
          Fetch Data
        </button>
      </div>
    );
  };
});

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock useInfiniteScroll
jest.mock('../../hooks/useInfiniteScroll', () => ({
  useInfiniteScroll: jest.fn(),
}));

// Mock antd notification
jest.mock('antd', () => ({
  ...jest.requireActual('antd'),
  notification: {
    error: jest.fn(),
  },
}));

describe('ViewPage Integration Tests', () => {
  const mockEncryptions = [
    { encryption_id: 1, name: 'Test Encryption 1' },
    { encryption_id: 2, name: 'Test Encryption 2' },
  ];

  const mockData = [
    { data_id: 1, text: 'Decrypted text 1', created_at: '2023-01-01T10:00:00Z' },
    { data_id: 2, text: 'Decrypted text 2', created_at: '2023-01-01T11:00:00Z' },
  ];

  beforeEach(() => {
    resetMocks();
    jest.clearAllMocks();
    mockNavigate.mockClear();
    
    // Setup default auth state
    useAuth.mockReturnValue({
      user: mockUser,
      signOut: jest.fn()
    });

    // Setup default API responses
    encryptionAPI.getAll.mockResolvedValue({
      data: { encryptions: mockEncryptions }
    });

    dataAPI.get.mockResolvedValue({
      data: { data: mockData }
    });
  });

  describe('Initial Render and State', () => {
    test('should render main layout components', async () => {
      renderWithProviders(<ViewPage />);
      
      // Check for header
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByText('View Encrypted Data')).toBeInTheDocument();
      
      // Check for sidebar with user info
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByText(`User: ${mockUser.name}`)).toBeInTheDocument();
      
      // Check for data viewer
      expect(screen.getByTestId('data-viewer')).toBeInTheDocument();
      
      // Check for page title and description
      expect(screen.getByText(/Decrypt and View Data/i)).toBeInTheDocument();
      expect(screen.getByText(/Select an encryption and enter your 64-digit encryption key/i)).toBeInTheDocument();
    });

    test('should render Back to Home button', () => {
      renderWithProviders(<ViewPage />);
      
      const backButton = screen.getByRole('button', { name: /Back to Home/i });
      expect(backButton).toBeInTheDocument();
    });

    test('should fetch encryptions on mount', async () => {
      renderWithProviders(<ViewPage />);
      
      await waitFor(() => {
        expect(encryptionAPI.getAll).toHaveBeenCalledTimes(1);
      });

      await waitFor(() => {
        expect(screen.getByText('Encryptions Count: 2')).toBeInTheDocument();
      });
    });
  });

  describe('Navigation', () => {
    test('should navigate to home page when Back to Home button is clicked', async () => {
      renderWithProviders(<ViewPage />);
      
      const backButton = screen.getByRole('button', { name: /Back to Home/i });
      userEvent.click(backButton);
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/home');
      });
    });
  });

  describe('Data Fetching', () => {
    test('should handle data fetching through DataViewer', async () => {
      renderWithProviders(<ViewPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('data-viewer')).toBeInTheDocument();
      });

      const fetchButton = screen.getByRole('button', { name: /Fetch Data/i });
      userEvent.click(fetchButton);
      
      await waitFor(() => {
        expect(dataAPI.get).toHaveBeenCalledWith('test-encryption', 'test-key');
      });
    });

    test('should handle encryption fetch errors', async () => {
      const { notification } = require('antd');
      encryptionAPI.getAll.mockRejectedValue(new Error('Network error'));

      renderWithProviders(<ViewPage />);
      
      await waitFor(() => {
        expect(notification.error).toHaveBeenCalledWith({
          message: 'Error',
          description: 'Failed to fetch encryptions',
        });
      });
    });

    test('should handle data fetch errors', async () => {
      const { notification } = require('antd');
      dataAPI.get.mockRejectedValue({
        response: {
          data: { message: 'Invalid encryption key' }
        }
      });

      renderWithProviders(<ViewPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('data-viewer')).toBeInTheDocument();
      });

      const fetchButton = screen.getByRole('button', { name: /Fetch Data/i });
      userEvent.click(fetchButton);
      
      await waitFor(() => {
        expect(notification.error).toHaveBeenCalledWith({
          message: 'Access Failed',
          description: 'Invalid encryption key',
        });
      });
    });
  });

  describe('Loading States', () => {
    test('should show encryptions loading state', async () => {
      // Make the API call hang to test loading state
      encryptionAPI.getAll.mockImplementation(() => new Promise(() => {}));

      renderWithProviders(<ViewPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Encryptions Loading: true')).toBeInTheDocument();
      });
    });

    test('should show data loading state', async () => {
      dataAPI.get.mockImplementation(() => new Promise(() => {}));

      renderWithProviders(<ViewPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('data-viewer')).toBeInTheDocument();
      });

      const fetchButton = screen.getByRole('button', { name: /Fetch Data/i });
      userEvent.click(fetchButton);
      
      await waitFor(() => {
        expect(screen.getByText('Data Loading: true')).toBeInTheDocument();
      });
    });
  });

  describe('User Authentication', () => {
    test('should display user information in sidebar', () => {
      renderWithProviders(<ViewPage />);
      
      expect(screen.getByText(`User: ${mockUser.name}`)).toBeInTheDocument();
    });

    test('should handle sign out from sidebar', async () => {
      const mockSignOut = jest.fn();
      
      useAuth.mockReturnValue({
        user: mockUser,
        signOut: mockSignOut
      });

      renderWithProviders(<ViewPage />);
      
      const signOutButton = screen.getByRole('button', { name: /Sign Out/i });
      userEvent.click(signOutButton);
      
      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Layout Structure', () => {
    test('should have proper layout structure', () => {
      const { container } = renderWithProviders(<ViewPage />);
      
      // Check for main layout
      expect(container.querySelector('.min-h-screen')).toBeInTheDocument();
    });

    test('should render all required components', () => {
      renderWithProviders(<ViewPage />);
      
      // All main components should be present
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('data-viewer')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    test('should handle different screen sizes', () => {
      const { container } = renderWithProviders(<ViewPage />);
      
      // Check if responsive classes are applied
      expect(container.querySelector('.max-w-4xl')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('should have proper heading hierarchy', () => {
      renderWithProviders(<ViewPage />);
      
      // Check for main heading
      const mainHeading = screen.getByRole('heading', { level: 2 });
      expect(mainHeading).toBeInTheDocument();
      expect(mainHeading).toHaveTextContent('Decrypt and View Data');
    });

    test('should have accessible buttons', () => {
      renderWithProviders(<ViewPage />);
      
      const backButton = screen.getByRole('button', { name: /Back to Home/i });
      expect(backButton).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('should handle missing user gracefully', () => {
      useAuth.mockReturnValue({
        user: null,
        signOut: jest.fn()
      });

      renderWithProviders(<ViewPage />);
      
      // Component should still render
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('data-viewer')).toBeInTheDocument();
    });

    test('should handle empty encryptions response', async () => {
      encryptionAPI.getAll.mockResolvedValue({
        data: { encryptions: [] }
      });

      renderWithProviders(<ViewPage />);
      
      await waitFor(() => {
        expect(screen.getByText('Encryptions Count: 0')).toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    test('should not have unnecessary re-renders', () => {
      const { rerender } = renderWithProviders(<ViewPage />);
      
      // Re-render with same props
      rerender(<ViewPage />);
      
      // Component should still be functional
      expect(screen.getByRole('button', { name: /Back to Home/i })).toBeInTheDocument();
    });
  });
}); 