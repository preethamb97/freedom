// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock Firebase
jest.mock('./services/firebase', () => ({
  auth: {
    signInWithPopup: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChanged: jest.fn(),
    currentUser: null
  },
  googleProvider: {},
  trackEvent: jest.fn(),
}));

// Mock SEO helpers
jest.mock('./utils/seoHelpers', () => ({
  trackEngagement: jest.fn(),
}));

// Mock analytics
jest.mock('./services/analytics', () => ({
  trackErrors: {
    apiError: jest.fn(),
    networkError: jest.fn(),
  },
  trackPerformance: {
    apiResponseTime: jest.fn(),
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  observe() {
    return null;
  }
  disconnect() {
    return null;
  }
  unobserve() {
    return null;
  }
};

// Suppress console warnings in tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' && (
        args[0].includes('Warning: ReactDOM.render is no longer supported') ||
        args[0].includes('Warning: `ReactDOMTestUtils.act` is deprecated') ||
        args[0].includes('Warning: ReactDOMTestUtils.act') ||
        args[0].includes('ReactDOMTestUtils.act')
      )
    ) {
      return;
    }
    return originalError.call(console, ...args);
  };

  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' && (
        args[0].includes('React Router Future Flag Warning') ||
        args[0].includes('React Router will begin wrapping') ||
        args[0].includes('v7_startTransition') ||
        args[0].includes('v7_relativeSplatPath')
      )
    ) {
      return;
    }
    return originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
}); 