import { mockFetch } from './mockHelpers';

export const authAPI = {
  login: async (credentials) => {
    const response = await mockFetch('http://localhost:8000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Błąd logowania');
    }

    return response.json();
  },

  register: async (userData) => {
    const response = await mockFetch('http://localhost:8000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: userData.firstName,
        last_name: userData.lastName,
        email: userData.email,
        password: userData.password,
      }),
      credentials: 'include',
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Rejestracja nie powiodła się');
    }

    return response.json();
  },

  checkAuth: async (token) => {
    const response = await mockFetch('http://localhost:8000/api/auth/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      throw new Error('Token invalid');
    }

    return response.json();
  },

  googleLogin: async (googleToken) => {
    const response = await mockFetch('http://localhost:8000/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: googleToken }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Błąd logowania przez Google');
    }

    return response.json();
  }
};