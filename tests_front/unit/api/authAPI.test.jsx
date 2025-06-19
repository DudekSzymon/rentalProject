import { describe, it, expect, beforeEach } from 'vitest';
import { authAPI } from '../helpers/apiHelpers';
import { mockFetch, resetAllMocks } from '../helpers/mockHelpers';

describe('SpellBudex Auth - API Functions', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  describe('Login API', () => {
    it('handles successful login', async () => {
      const mockResponse = {
        access_token: 'test-token',
        user: { id: 1, email: 'test@example.com', role: 'user' }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await authAPI.login({ email: 'test@example.com', password: 'password' });

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com', password: 'password' })
      });

      expect(result).toEqual(mockResponse);
    });

    it('handles login error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'Invalid credentials' })
      });

      await expect(authAPI.login({ email: 'wrong@example.com', password: 'wrong' }))
        .rejects.toThrow('Invalid credentials');
    });

    it('handles login error without detail', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({})
      });

      await expect(authAPI.login({ email: 'wrong@example.com', password: 'wrong' }))
        .rejects.toThrow('Błąd logowania');
    });

    it('handles network error during login', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(authAPI.login({ email: 'test@example.com', password: 'password' }))
        .rejects.toThrow('Network error');
    });
  });

  describe('Register API', () => {
    it('handles successful registration', async () => {
      const userData = {
        firstName: 'Jan',
        lastName: 'Kowalski',
        email: 'jan@example.com',
        password: 'password123'
      };

      const mockResponse = {
        access_token: 'new-token',
        user: { id: 2, email: 'jan@example.com' }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await authAPI.register(userData);

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: 'Jan',
          last_name: 'Kowalski',
          email: 'jan@example.com',
          password: 'password123'
        }),
        credentials: 'include'
      });

      expect(result).toEqual(mockResponse);
    });

    it('handles registration error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'Email already exists' })
      });

      await expect(authAPI.register({
        firstName: 'Jan',
        lastName: 'Kowalski',
        email: 'existing@example.com',
        password: 'password123'
      })).rejects.toThrow('Email already exists');
    });

    it('handles registration error without detail', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({})
      });

      await expect(authAPI.register({
        firstName: 'Jan',
        lastName: 'Kowalski',
        email: 'new@example.com',
        password: 'password123'
      })).rejects.toThrow('Rejestracja nie powiodła się');
    });
  });

  describe('Auth Check API', () => {
    it('handles successful auth check', async () => {
      const mockUser = { id: 1, email: 'test@example.com', role: 'admin' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockUser
      });

      const result = await authAPI.checkAuth('valid-token');

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/api/auth/me', {
        headers: { 'Authorization': 'Bearer valid-token' }
      });

      expect(result).toEqual(mockUser);
    });

    it('handles invalid token', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'Token expired' })
      });

      await expect(authAPI.checkAuth('invalid-token'))
        .rejects.toThrow('Token invalid');
    });
  });

  describe('Google Login API', () => {
    it('handles successful Google login', async () => {
      const mockResponse = {
        access_token: 'google-token',
        user: { id: 3, email: 'google@example.com' }
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await authAPI.googleLogin('google-credential-token');

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'google-credential-token' })
      });

      expect(result).toEqual(mockResponse);
    });

    it('handles Google login error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'Invalid Google token' })
      });

      await expect(authAPI.googleLogin('invalid-google-token'))
        .rejects.toThrow('Invalid Google token');
    });

    it('handles Google login error without detail', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({})
      });

      await expect(authAPI.googleLogin('google-token'))
        .rejects.toThrow('Błąd logowania przez Google');
    });
  });
});