import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ViewPage from '../../pages/ViewPage';
import { MemoryRouter } from 'react-router-dom';
import { notification } from 'antd';
import { encryptionAPI, dataAPI } from '../../services/api';

// Mock the useAuth hook
const mockSignOut = jest.fn();
const mockUseAuth = jest.fn();

// Mock react-router-dom navigation
const mockNavigate = jest.fn();

// Set up all mocks before any imports
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }) => <div data-testid="auth-provider">{children}</div>
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../services/api', () => ({
  encryptionAPI: {
    getAll: jest.fn()
  },
  dataAPI: {
    retrieve: jest.fn()
  },
}));

jest.mock('antd', () => ({
  ...jest.requireActual('antd'),
  notification: {
    error: jest.fn()
  },
}));

jest.mock('../../hooks/useInfiniteScroll', () => ({
  useInfiniteScroll: jest.fn(),
}));

// Mock the organisms components
jest.mock('../../organisms/Header', () => {
  return function MockHeader({ title, showMobileMenu, onMenuClick }) {
    return (
      <div data-testid="header">
        <h1>{title}</h1>
        <button onClick={onMenuClick} data-testid="menu-button">Menu</button>
      </div>
    );
  };
});

jest.mock('../../organisms/Sidebar', () => {
  return function MockSidebar({ user, onSignOut, isMobile, isOpen, onClose }) {
    return (
      <div data-testid="sidebar" className={isOpen ? 'open' : 'closed'}>
        <div data-testid="user-info">User: {user?.name || 'No user'}</div>
        <button onClick={onSignOut} data-testid="sign-out-button">Sign Out</button>
        {isMobile && <button onClick={onClose} data-testid="close-sidebar">Close</button>}
      </div>
    );
  };
});

jest.mock('../../molecules/DataViewer', () => {
  return function MockDataViewer({ encryptions, data, onFetchData, loading, encryptionsLoading, hasMore }) {
    return (
      <div data-testid="data-viewer">
        <div data-testid="encryptions-loading">Encryptions Loading: {encryptionsLoading.toString()}</div>
        <div data-testid="encryptions-count">Encryptions Count: {encryptions.length}</div>
        <div data-testid="data-loading">Data Loading: {loading.toString()}</div>
        <button 
          data-testid="fetch-data-button" 
          onClick={() => onFetchData('test-encryption', 'test-key', 0, 10)}
        >
          Fetch Data
        </button>
        {data.length > 0 && (
          <div data-testid="data-results">
            {data.map(item => (
              <div key={item.data_id}>{item.text}</div>
            ))}
          </div>
        )}
      </div>
    );
  };
});

// Custom render function with router
const renderWithRouter = (ui) => {
  return render(
    <MemoryRouter>
      {ui}
    </MemoryRouter>
  );
};

describe('ViewPage Tests', () => {
  const mockUser = {
    uid: 'test-user-123',
    name: 'Test User',
    email: 'test@example.com',
  };

  const mockEncryptions = [
    { encryption_id: 1, name: 'Test Encryption 1' },
    { encryption_id: 2, name: 'Test Encryption 2' },
  ];

  const mockData = [
    { data_id: 1, text: 'Decrypted text 1', created_at: '2023-01-01T10:00:00Z' },
    { data_id: 2, text: 'Decrypted text 2', created_at: '2023-01-01T11:00:00Z' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementation
    mockUseAuth.mockReturnValue({
      user: mockUser,
      signOut: mockSignOut
    });

    // Setup default API responses
    encryptionAPI.getAll.mockResolvedValue({
      data: { encryptions: mockEncryptions }
    });

    dataAPI.retrieve.mockResolvedValue({
      data: { data: mockData }
    });
  });

  describe('Component Rendering', () => {
    test('should render main layout components', async () => {
      renderWithRouter(<ViewPage />);
      
      // Check for header
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByText('View Encrypted Data')).toBeInTheDocument();
      
      // Check for sidebar with user info
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('user-info')).toHaveTextContent(`User: ${mockUser.name}`);
      
      // Check for data viewer
      expect(screen.getByTestId('data-viewer')).toBeInTheDocument();
      
      // Check for page title and description
      expect(screen.getByText('Decrypt and View Data')).toBeInTheDocument();
      expect(screen.getByText(/Select an encryption and enter your 64-digit encryption key/)).toBeInTheDocument();
    });

    test('should render Back to Home button', () => {
      renderWithRouter(<ViewPage />);
      
      const backButton = screen.getByRole('button', { name: /Back to Home/i });
      expect(backButton).toBeInTheDocument();
    });

    test('should fetch encryptions on mount', async () => {
      renderWithRouter(<ViewPage />);
      
      await waitFor(() => {
        expect(encryptionAPI.getAll).toHaveBeenCalledTimes(1);
      });

      await waitFor(() => {
        expect(screen.getByTestId('encryptions-count')).toHaveTextContent('Encryptions Count: 2');
      });
    });
  });

  describe('Navigation', () => {
    test('should navigate to home page when Back to Home button is clicked', async () => {
      renderWithRouter(<ViewPage />);
      
      const backButton = screen.getByRole('button', { name: /Back to Home/i });
      await userEvent.click(backButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/home');
    });
  });

  describe('Data Fetching', () => {
    test('should handle data fetching through DataViewer', async () => {
      renderWithRouter(<ViewPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('data-viewer')).toBeInTheDocument();
      });

      const fetchButton = screen.getByTestId('fetch-data-button');
      await userEvent.click(fetchButton);
      
      await waitFor(() => {
        expect(dataAPI.retrieve).toHaveBeenCalledWith('test-encryption', {
          passphrase: 'test-key',
          offset: 0,
          limit: 10
        });
      });
    });

    test('should handle encryption fetch errors', async () => {
      encryptionAPI.getAll.mockRejectedValue(new Error('Network error'));

      renderWithRouter(<ViewPage />);
      
      await waitFor(() => {
        expect(notification.error).toHaveBeenCalledWith({
          message: 'Error',
          description: 'Failed to fetch encryptions',
        });
      });
    });

    test('should handle data fetch errors', async () => {
      dataAPI.retrieve.mockRejectedValue({
        response: {
          data: { message: 'Invalid encryption key' }
        }
      });

      renderWithRouter(<ViewPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('data-viewer')).toBeInTheDocument();
      });

      const fetchButton = screen.getByTestId('fetch-data-button');
      await userEvent.click(fetchButton);
      
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
      encryptionAPI.getAll.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      renderWithRouter(<ViewPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('encryptions-loading')).toHaveTextContent('Encryptions Loading: true');
      });
    });

    test('should show data loading state', async () => {
      dataAPI.retrieve.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      renderWithRouter(<ViewPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('data-viewer')).toBeInTheDocument();
      });

      const fetchButton = screen.getByTestId('fetch-data-button');
      await userEvent.click(fetchButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('data-loading')).toHaveTextContent('Data Loading: true');
      });
    });
  });

  describe('User Authentication', () => {
    test('should display user information in sidebar', () => {
      renderWithRouter(<ViewPage />);
      
      expect(screen.getByTestId('user-info')).toHaveTextContent(`User: ${mockUser.name}`);
    });

    test('should handle sign out from sidebar', async () => {
      renderWithRouter(<ViewPage />);
      
      const signOutButton = screen.getByTestId('sign-out-button');
      await userEvent.click(signOutButton);
      
      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });
  });

  describe('Error Handling', () => {
    test('should handle missing user gracefully', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        signOut: mockSignOut
      });

      renderWithRouter(<ViewPage />);
      
      // Component should still render
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('data-viewer')).toBeInTheDocument();
      expect(screen.getByTestId('user-info')).toHaveTextContent('User: No user');
    });

    test('should handle empty encryptions response', async () => {
      encryptionAPI.getAll.mockResolvedValue({
        data: { encryptions: [] }
      });

      renderWithRouter(<ViewPage />);
      
      await waitFor(() => {
        expect(screen.getByTestId('encryptions-count')).toHaveTextContent('Encryptions Count: 0');
      });
    });
  });

  describe('Layout Structure', () => {
    test('should have proper layout structure', () => {
      const { container } = renderWithRouter(<ViewPage />);
      
      // Check for main layout
      expect(container.querySelector('.min-h-screen')).toBeInTheDocument();
    });

    test('should render all required components', () => {
      renderWithRouter(<ViewPage />);
      
      // All main components should be present
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('data-viewer')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    test('should handle different screen sizes', () => {
      const { container } = renderWithRouter(<ViewPage />);
      
      // Check if responsive classes are applied
      expect(container.querySelector('.max-w-4xl')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('should have proper heading hierarchy', () => {
      renderWithRouter(<ViewPage />);
      
      // Check for main heading
      const mainHeading = screen.getByRole('heading', { level: 2 });
      expect(mainHeading).toBeInTheDocument();
      expect(mainHeading).toHaveTextContent('Decrypt and View Data');
    });

    test('should have accessible buttons', () => {
      renderWithRouter(<ViewPage />);
      
      const backButton = screen.getByRole('button', { name: /Back to Home/i });
      expect(backButton).toBeInTheDocument();
    });
  });
}); 