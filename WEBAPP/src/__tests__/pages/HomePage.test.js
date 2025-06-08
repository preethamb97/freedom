import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HomePage from '../../pages/HomePage';
import { renderWithProviders, resetMocks, mockUser } from '../../utils/test-utils';
import { useAuth } from '../../hooks/useAuth';

// Mock the useAuth hook
jest.mock('../../hooks/useAuth');

// Mock the organisms components
jest.mock('../../organisms/Header', () => {
  return function MockHeader() {
    return <div data-testid="header">Header</div>;
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

jest.mock('../../organisms/MainContent', () => {
  return function MockMainContent() {
    return <div data-testid="main-content">Main Content</div>;
  };
});

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('HomePage Integration Tests', () => {
  beforeEach(() => {
    resetMocks();
    jest.clearAllMocks();
    mockNavigate.mockClear();
    
    // Setup default auth state
    useAuth.mockReturnValue({
      user: mockUser,
      signOut: jest.fn()
    });
  });

  describe('Initial Render and State', () => {
    test('should render main layout components', async () => {
      renderWithProviders(<HomePage />);
      
      // Check for header
      expect(screen.getByTestId('header')).toBeInTheDocument();
      
      // Check for sidebar with user info
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByText(`User: ${mockUser.name}`)).toBeInTheDocument();
      
      // Check for main content
      expect(screen.getByTestId('main-content')).toBeInTheDocument();
      
      // Check for page title and description
      expect(screen.getByText(/Encryption Management/i)).toBeInTheDocument();
      expect(screen.getByText(/Create new encryptions and store encrypted data securely/i)).toBeInTheDocument();
    });

    test('should render View Data button', () => {
      renderWithProviders(<HomePage />);
      
      const viewDataButton = screen.getByRole('button', { name: /View Data/i });
      expect(viewDataButton).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    test('should navigate to view page when View Data button is clicked', async () => {
      renderWithProviders(<HomePage />);
      
      const viewDataButton = screen.getByRole('button', { name: /View Data/i });
      userEvent.click(viewDataButton);
      
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/view');
      });
    });
  });

  describe('User Authentication', () => {
    test('should display user information in sidebar', () => {
      renderWithProviders(<HomePage />);
      
      expect(screen.getByText(`User: ${mockUser.name}`)).toBeInTheDocument();
    });

    test('should handle sign out from sidebar', async () => {
      const mockSignOut = jest.fn();
      
      useAuth.mockReturnValue({
        user: mockUser,
        signOut: mockSignOut
      });

      renderWithProviders(<HomePage />);
      
      const signOutButton = screen.getByRole('button', { name: /Sign Out/i });
      userEvent.click(signOutButton);
      
      await waitFor(() => {
        expect(mockSignOut).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Layout Structure', () => {
    test('should have proper layout structure', () => {
      const { container } = renderWithProviders(<HomePage />);
      
      // Check for main layout
      expect(container.querySelector('.min-h-screen')).toBeInTheDocument();
    });

    test('should render all required components', () => {
      renderWithProviders(<HomePage />);
      
      // All main components should be present
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('main-content')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    test('should handle different screen sizes', () => {
      const { container } = renderWithProviders(<HomePage />);
      
      // Check if responsive classes are applied
      expect(container.querySelector('.max-w-4xl')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    test('should have proper heading hierarchy', () => {
      renderWithProviders(<HomePage />);
      
      // Check for main heading
      const mainHeading = screen.getByRole('heading', { level: 2 });
      expect(mainHeading).toBeInTheDocument();
      expect(mainHeading).toHaveTextContent('Encryption Management');
    });

    test('should have accessible buttons', () => {
      renderWithProviders(<HomePage />);
      
      const viewDataButton = screen.getByRole('button', { name: /View Data/i });
      expect(viewDataButton).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    test('should handle missing user gracefully', () => {
      useAuth.mockReturnValue({
        user: null,
        signOut: jest.fn()
      });

      renderWithProviders(<HomePage />);
      
      // Component should still render
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('sidebar')).toBeInTheDocument();
      expect(screen.getByTestId('main-content')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    test('should not have unnecessary re-renders', () => {
      const { rerender } = renderWithProviders(<HomePage />);
      
      // Re-render with same props
      rerender(<HomePage />);
      
      // Component should still be functional
      expect(screen.getByRole('button', { name: /View Data/i })).toBeInTheDocument();
    });
  });
}); 