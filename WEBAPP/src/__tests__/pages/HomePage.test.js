import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HomePage from '../../pages/HomePage';
import { MemoryRouter } from 'react-router-dom';

// Mock the useAuth hook
const mockSignOut = jest.fn();
const mockUseAuth = jest.fn();

jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }) => <div data-testid="auth-provider">{children}</div>
}));

// Mock the organisms components
jest.mock('../../organisms/Header', () => {
  return function MockHeader({ showMobileMenu, onMenuClick }) {
    return (
      <div data-testid="header">
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

jest.mock('../../organisms/MainContent', () => {
  return function MockMainContent() {
    return (
      <div data-testid="main-content">
        <div data-testid="encryption-form">
          <h3>Create New Encryption</h3>
          <form>Create encryption form</form>
        </div>
        <div data-testid="data-form">
          <h3>Store Encrypted Data</h3>
          <form>Store data form</form>
        </div>
      </div>
    );
  };
});

// Mock react-router-dom navigation
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Custom render function with router
const renderWithRouter = (ui) => {
  return render(
    <MemoryRouter>
      {ui}
    </MemoryRouter>
  );
};

describe('HomePage Tests', () => {
  const mockUser = {
    uid: 'test-user-123',
    name: 'Test User',
    email: 'test@example.com',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementation
    mockUseAuth.mockReturnValue({
      user: mockUser,
      signOut: mockSignOut
    });
  });

  describe('Component Rendering', () => {
    test('should render main layout components', () => {
      renderWithRouter(<HomePage />);
      
      // Check for header
      expect(screen.getByTestId('header')).toBeInTheDocument();
      
      // Check for sidebar with user info
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('user-info')).toHaveTextContent(`User: ${mockUser.name}`);
      
      // Check for main content
      expect(screen.getByTestId('main-content')).toBeInTheDocument();
      
      // Check for page title and description in the header section (not MainContent)
      expect(screen.getByText('Encryption Management')).toBeInTheDocument();
      expect(screen.getByText('Create new encryptions and store encrypted data securely')).toBeInTheDocument();
    });

    test('should render View Data button', () => {
      renderWithRouter(<HomePage />);
      
      // Use more specific selector to get the primary View Data button from the header
      const viewDataButton = screen.getByRole('button', { name: /View Data/i });
      expect(viewDataButton).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    test('should navigate to view page when View Data button is clicked', async () => {
      renderWithRouter(<HomePage />);
      
      // Get the primary View Data button from the header
      const viewDataButton = screen.getByRole('button', { name: /View Data/i });
      await userEvent.click(viewDataButton);
      
      expect(mockNavigate).toHaveBeenCalledWith('/view');
    });
  });

  describe('User Authentication', () => {
    test('should display user information in sidebar', () => {
      renderWithRouter(<HomePage />);
      
      expect(screen.getByTestId('user-info')).toHaveTextContent(`User: ${mockUser.name}`);
    });

    test('should handle sign out from sidebar', async () => {
      renderWithRouter(<HomePage />);
      
      const signOutButton = screen.getByTestId('sign-out-button');
      await userEvent.click(signOutButton);
      
      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });

    test('should handle missing user gracefully', () => {
      mockUseAuth.mockReturnValue({
        user: null,
        signOut: mockSignOut
      });

      renderWithRouter(<HomePage />);
      
      // Component should still render
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('main-content')).toBeInTheDocument();
      expect(screen.getByTestId('user-info')).toHaveTextContent('User: No user');
    });
  });

  describe('Layout Structure', () => {
    test('should have proper layout structure', () => {
      const { container } = renderWithRouter(<HomePage />);
      
      // Check for main layout
      expect(container.querySelector('.min-h-screen')).toBeInTheDocument();
    });

    test('should render all required components', () => {
      renderWithRouter(<HomePage />);
      
      // All main components should be present
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('main-content')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    test('should handle different screen sizes', () => {
      const { container } = renderWithRouter(<HomePage />);
      
      // Check if responsive classes are applied
      expect(container.querySelector('.max-w-4xl')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('should have proper heading hierarchy', () => {
      renderWithRouter(<HomePage />);
      
      // Check for main heading in the header section
      const mainHeading = screen.getByRole('heading', { name: 'Encryption Management' });
      expect(mainHeading).toBeInTheDocument();
      expect(mainHeading).toHaveTextContent('Encryption Management');
    });

    test('should have accessible buttons', () => {
      renderWithRouter(<HomePage />);
      
      // Check for the primary View Data button
      const viewDataButton = screen.getByRole('button', { name: /View Data/i });
      expect(viewDataButton).toBeInTheDocument();
    });
  });
}); 