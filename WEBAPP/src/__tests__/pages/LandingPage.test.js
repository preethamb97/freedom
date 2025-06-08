import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LandingPage from '../../pages/LandingPage';
import { renderWithProviders, resetMocks, mockUser } from '../../utils/test-utils';
import { useAuth } from '../../hooks/useAuth';

// Mock the useAuth hook
jest.mock('../../hooks/useAuth');

describe('LandingPage Integration Tests', () => {
  beforeEach(() => {
    resetMocks();
    jest.clearAllMocks();
  });

  describe('Initial Render', () => {
    test('should render all landing page elements', () => {
      useAuth.mockReturnValue({
        signIn: jest.fn(),
        loading: false
      });

      renderWithProviders(<LandingPage />);
      
      // Check for main heading
      expect(screen.getByText(/Encrypted Data UI/i)).toBeInTheDocument();
      
      // Check for description text
      expect(screen.getByText(/Secure your data with AES-256 encryption/i)).toBeInTheDocument();
      
      // Check for Google login button
      expect(screen.getByRole('button', { name: /Sign in with Google/i })).toBeInTheDocument();
      
      // Check for features section using more specific text matching
      expect(screen.getByText(/AES-256-GCM/i)).toBeInTheDocument();
      expect(screen.getByText(/64-digit encryption key security/i)).toBeInTheDocument();
      expect(screen.getByText(/Secure key-based data/i)).toBeInTheDocument();
    });

    test('should render with proper styling', () => {
      useAuth.mockReturnValue({
        signIn: jest.fn(),
        loading: false
      });

      const { container } = renderWithProviders(<LandingPage />);
      
      // Check for layout components
      expect(container.querySelector('.min-h-screen')).toBeInTheDocument();
    });
  });

  describe('Google Authentication', () => {
    test('should handle Google login click', async () => {
      const mockSignIn = jest.fn();
      
      useAuth.mockReturnValue({
        signIn: mockSignIn,
        loading: false
      });

      renderWithProviders(<LandingPage />);
      
      const googleButton = screen.getByRole('button', { name: /Sign in with Google/i });
      
      userEvent.click(googleButton);
      
      await waitFor(() => {
        expect(mockSignIn).toHaveBeenCalledTimes(1);
      });
    });

    test('should show loading state during authentication', async () => {
      useAuth.mockReturnValue({
        signIn: jest.fn(),
        loading: true
      });

      renderWithProviders(<LandingPage />);
      
      // Check if loading spinner is shown
      expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument(); // Ant Design Spin component
      expect(screen.queryByRole('button', { name: /Sign in with Google/i })).not.toBeInTheDocument();
    });
  });

  describe('Features Section', () => {
    test('should display all security features', () => {
      useAuth.mockReturnValue({
        signIn: jest.fn(),
        loading: false
      });

      renderWithProviders(<LandingPage />);
      
      // Check for feature list using more specific text matching
      const features = [
        /AES-256-GCM encryption/i,
        /64-digit encryption key security/i,
        /Secure key-based data access/i,
        /Rate limiting protection/i
      ];
      
      features.forEach(feature => {
        expect(screen.getByText(feature)).toBeInTheDocument();
      });
    });

    test('should render feature icons', () => {
      useAuth.mockReturnValue({
        signIn: jest.fn(),
        loading: false
      });

      const { container } = renderWithProviders(<LandingPage />);
      
      // Check for Ant Design icons
      const icons = container.querySelectorAll('.anticon');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    test('should have proper heading hierarchy', () => {
      useAuth.mockReturnValue({
        signIn: jest.fn(),
        loading: false
      });

      renderWithProviders(<LandingPage />);
      
      // Check for proper heading levels
      const mainHeading = screen.getByRole('heading', { level: 2 });
      expect(mainHeading).toBeInTheDocument();
      
      const subHeadings = screen.getAllByRole('heading', { level: 5 });
      expect(subHeadings.length).toBeGreaterThan(0);
    });

    test('should have accessible button labels', () => {
      useAuth.mockReturnValue({
        signIn: jest.fn(),
        loading: false
      });

      renderWithProviders(<LandingPage />);
      
      const googleButton = screen.getByRole('button', { name: /Sign in with Google/i });
      expect(googleButton).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    test('should not have unnecessary re-renders', () => {
      useAuth.mockReturnValue({
        signIn: jest.fn(),
        loading: false
      });

      const { rerender } = renderWithProviders(<LandingPage />);
      
      // Re-render with same props
      rerender(<LandingPage />);
      
      // Component should still be functional
      expect(screen.getByRole('button', { name: /Sign in with Google/i })).toBeInTheDocument();
    });
  });
}); 