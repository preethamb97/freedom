import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LandingPage from '../../pages/LandingPage';
import { MemoryRouter } from 'react-router-dom';

// Mock the useAuth hook
const mockSignIn = jest.fn();
const mockUseAuth = jest.fn();

jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }) => <div data-testid="auth-provider">{children}</div>
}));

// Mock Firebase tracking services
jest.mock('../../services/firebase', () => ({
  trackEvent: jest.fn(),
}));

jest.mock('../../utils/seoHelpers', () => ({
  trackEngagement: jest.fn(),
}));

// Custom render function with router
const renderWithRouter = (ui) => {
  return render(
    <MemoryRouter>
      {ui}
    </MemoryRouter>
  );
};

describe('LandingPage Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mock implementation
    mockUseAuth.mockReturnValue({
      signIn: mockSignIn,
      loading: false
    });
  });

  describe('Component Rendering', () => {
    test('should render main title and description', () => {
      renderWithRouter(<LandingPage />);
      
      // Check for main heading by role and level
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Freedom');
      
      // Check for subtitle
      expect(screen.getByText('Secure AES-256 Encrypted Data Storage')).toBeInTheDocument();
      
      // Check for description with partial text
      expect(screen.getByText(/Protect your sensitive data with military-grade/)).toBeInTheDocument();
    });

    test('should render sign in button when not loading', () => {
      renderWithRouter(<LandingPage />);
      
      const signInButton = screen.getByRole('button', { name: /Sign in with Google/i });
      expect(signInButton).toBeInTheDocument();
    });

    test('should show loading state when loading', () => {
      mockUseAuth.mockReturnValue({
        signIn: mockSignIn,
        loading: true
      });

      renderWithRouter(<LandingPage />);
      
      // Check for loading text
      expect(screen.getByText(/Signing in.../i)).toBeInTheDocument();
      
      // Button should not be visible
      expect(screen.queryByRole('button', { name: /Sign in with Google/i })).not.toBeInTheDocument();
    });
  });

  describe('Security Features', () => {
    test('should display security features list', () => {
      renderWithRouter(<LandingPage />);
      
      // Check for security features section
      expect(screen.getByText('Security Features:')).toBeInTheDocument();
      
      // Check for individual features by looking within list items
      expect(screen.getByText(/Military-grade security/)).toBeInTheDocument();
      expect(screen.getByText(/Maximum protection/)).toBeInTheDocument();
      expect(screen.getByText(/Complete privacy/)).toBeInTheDocument();
      expect(screen.getByText(/Brute-force prevention/)).toBeInTheDocument();
      expect(screen.getByText(/Data never exposed/)).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    test('should call signIn when button is clicked', async () => {
      renderWithRouter(<LandingPage />);
      
      const signInButton = screen.getByRole('button', { name: /Sign in with Google/i });
      
      // Use legacy userEvent API for older versions
      await userEvent.click(signInButton);
      
      expect(mockSignIn).toHaveBeenCalledTimes(1);
    });
  });

  describe('Layout and Styling', () => {
    test('should have proper layout structure', () => {
      const { container } = renderWithRouter(<LandingPage />);
      
      // Check for main layout classes
      expect(container.querySelector('.min-h-screen')).toBeInTheDocument();
    });

    test('should have accessible headings', () => {
      renderWithRouter(<LandingPage />);
      
      // Check for proper heading hierarchy
      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Freedom');
      
      const subHeading = screen.getByRole('heading', { level: 2 });
      expect(subHeading).toHaveTextContent('Secure AES-256 Encrypted Data Storage');
    });

    test('should have accessible button with aria-label', () => {
      renderWithRouter(<LandingPage />);
      
      const signInButton = screen.getByRole('button', { name: /Sign in with Google/i });
      expect(signInButton).toHaveAttribute('aria-label');
    });
  });

  describe('Footer Content', () => {
    test('should display footer information', () => {
      renderWithRouter(<LandingPage />);
      
      expect(screen.getByText(/By signing in, you agree to our secure data handling practices/)).toBeInTheDocument();
      // Check for footer specific text instead of the duplicate "Freedom" text
      expect(screen.getByText(/Where privacy meets security/)).toBeInTheDocument();
    });
  });
}); 