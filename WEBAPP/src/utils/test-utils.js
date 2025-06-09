import React from 'react';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../hooks/useAuth';

// Create a custom render function that includes providers
export const renderWithProviders = (ui, options = {}) => {
  const { initialEntries = ['/'], ...renderOptions } = options;

  const Wrapper = ({ children }) => (
    <AuthProvider>
      <MemoryRouter 
        initialEntries={initialEntries}
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        {children}
      </MemoryRouter>
    </AuthProvider>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Mock user object for testing
export const mockUser = {
  uid: 'test-user-123',
  name: 'Test User',
  email: 'test@example.com',
  photo: 'https://example.com/photo.jpg'
};

// Mock encryption data
export const mockEncryptions = [
  {
    encryption_id: 1,
    name: 'Test Encryption 1',
    created_at: '2023-01-01T00:00:00Z',
    updated_at: '2023-01-01T00:00:00Z'
  },
  {
    encryption_id: 2,
    name: 'Test Encryption 2',
    created_at: '2023-01-02T00:00:00Z',
    updated_at: '2023-01-02T00:00:00Z'
  }
];

// Mock encrypted data
export const mockEncryptedData = [
  {
    data_id: 1,
    text: 'Test encrypted text 1',
    created_at: '2023-01-01T10:00:00Z',
    updated_at: '2023-01-01T10:00:00Z'
  },
  {
    data_id: 2,
    text: 'Test encrypted text 2',
    created_at: '2023-01-01T11:00:00Z',
    updated_at: '2023-01-01T11:00:00Z'
  }
];

// Test encryption key
export const testEncryptionKey = 'A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6a7b8c9d0';

// API response mocks
export const createMockResponse = (data, status = 200) => ({
  data,
  status,
  statusText: 'OK',
  headers: {},
  config: {}
});

// Mock API functions
export const mockAPI = {
  encryption: {
    getAll: jest.fn(),
    create: jest.fn(),
    verifyKey: jest.fn()
  },
  data: {
    store: jest.fn(),
    get: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  auth: {
    googleLogin: jest.fn(),
    getProfile: jest.fn(),
    updateProfile: jest.fn()
  }
};

// Reset all mocks
export const resetMocks = () => {
  Object.values(mockAPI).forEach(apiGroup => {
    Object.values(apiGroup).forEach(mockFn => {
      mockFn.mockReset();
    });
  });
  
  // Only clear localStorage mocks if they exist and are functions
  if (localStorage.getItem && typeof localStorage.getItem.mockClear === 'function') {
    localStorage.getItem.mockClear();
  }
  if (localStorage.setItem && typeof localStorage.setItem.mockClear === 'function') {
    localStorage.setItem.mockClear();
  }
  if (localStorage.removeItem && typeof localStorage.removeItem.mockClear === 'function') {
    localStorage.removeItem.mockClear();
  }
  if (localStorage.clear && typeof localStorage.clear.mockClear === 'function') {
    localStorage.clear.mockClear();
  }
  
  // Clear default encryption setting
  if (typeof localStorage.removeItem === 'function') {
    localStorage.removeItem('defaultEncryptionId');
  }
};

// Helper function to set default encryption for tests
export const setDefaultEncryption = (encryptionId) => {
  if (typeof localStorage.setItem === 'function') {
    localStorage.setItem('defaultEncryptionId', encryptionId.toString());
  }
};

// Helper function to clear default encryption for tests
export const clearDefaultEncryption = () => {
  if (typeof localStorage.removeItem === 'function') {
    localStorage.removeItem('defaultEncryptionId');
  }
};

// Setup successful API responses
export const setupSuccessfulAPIMocks = () => {
  mockAPI.encryption.getAll.mockResolvedValue(
    createMockResponse({ encryptions: mockEncryptions })
  );
  
  mockAPI.encryption.create.mockResolvedValue(
    createMockResponse({ 
      encryption: mockEncryptions[0],
      message: 'Encryption created successfully' 
    })
  );
  
  mockAPI.data.store.mockResolvedValue(
    createMockResponse({ 
      data: mockEncryptedData[0],
      message: 'Data stored successfully' 
    })
  );
  
  mockAPI.data.get.mockResolvedValue(
    createMockResponse({ 
      data: mockEncryptedData,
      hasMore: false 
    })
  );
  
  mockAPI.auth.googleLogin.mockResolvedValue(
    createMockResponse({ 
      user: mockUser,
      token: 'mock-jwt-token' 
    })
  );
};

// Setup error API responses
export const setupErrorAPIMocks = () => {
  const errorResponse = {
    response: {
      status: 400,
      data: { message: 'Test error message' }
    }
  };
  
  mockAPI.encryption.getAll.mockRejectedValue(errorResponse);
  mockAPI.encryption.create.mockRejectedValue(errorResponse);
  mockAPI.data.store.mockRejectedValue(errorResponse);
  mockAPI.data.get.mockRejectedValue(errorResponse);
  mockAPI.auth.googleLogin.mockRejectedValue(errorResponse);
};

// Wait for async operations
export const waitFor = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms)); 