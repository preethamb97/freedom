import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Clean up any inconsistent localStorage data
const cleanupLocalStorage = () => {
  const storedUser = localStorage.getItem('user');
  const storedToken = localStorage.getItem('token');
  const oldAuthToken = localStorage.getItem('auth_token');
  
  // If we have the old token key, migrate it and remove the old one
  if (oldAuthToken && !storedToken) {
    localStorage.setItem('token', oldAuthToken);
    localStorage.removeItem('auth_token');
  } else if (oldAuthToken) {
    // Remove the old key if both exist
    localStorage.removeItem('auth_token');
  }
  
  // If we have a token but no user, or user but no token, clear both
  if ((storedToken && !storedUser) || (storedUser && !storedToken)) {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    localStorage.removeItem('auth_token');
  }
};

// Clean up before initializing the app
cleanupLocalStorage();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <App />
); 