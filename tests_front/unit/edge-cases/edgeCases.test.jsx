import { describe, it, expect, beforeEach } from 'vitest';
import { validateRegisterForm, validateLoginForm } from '../helpers/validationHelpers';
import { authAPI } from '../helpers/apiHelpers';
import { isValidEmail, isStrongPassword, formatUserName } from '../helpers/utilityHelpers';
import { mockFetch, resetAllMocks } from '../helpers/mockHelpers';

describe('SpellBudex Auth - Edge Cases', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  describe('Form Validation Edge Cases', () => {
    it('handles empty form data', () => {
      const emptyForm = {
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        confirm: '',
        accept: false
      };

      const result = validateRegisterForm(emptyForm);

      expect(result.isValid).toBe(false);
      expect(Object.keys(result.errors).length).toBeGreaterThan(0);
      expect(result.errors.firstName).toContain('minimum 2 znaki');
      expect(result.errors.lastName).toContain('minimum 2 znaki');
      expect(result.errors.email).toContain('Email jest wymagany');
      expect(result.errors.password).toContain('Hasło jest wymagane');
      expect(result.errors.accept).toContain('Musisz zaakceptować warunki');
    });

    it('handles whitespace-only form data', () => {
      const whitespaceForm = {
        firstName: '   ',
        lastName: '   ',
        email: '   ',
        password: '   ',
        confirm: '   ',
        accept: false
      };

      const result = validateRegisterForm(whitespaceForm);

      expect(result.isValid).toBe(false);
      expect(result.errors.firstName).toContain('minimum 2 znaki');
      expect(result.errors.lastName).toContain('minimum 2 znaki');
    });

    it('handles special characters in names', () => {
      const form = {
        firstName: 'Józef',
        lastName: 'Kowalski-Nowak',
        email: 'jozef@example.com',
        password: 'password123',
        confirm: 'password123',
        accept: true
      };

      const result = validateRegisterForm(form);
      expect(result.isValid).toBe(true);
    });

    it('handles Unicode characters in names', () => {
      const form = {
        firstName: 'Николай',
        lastName: 'Müller',
        email: 'nikolai@example.com',
        password: 'password123',
        confirm: 'password123',
        accept: true
      };

      const result = validateRegisterForm(form);
      expect(result.isValid).toBe(true);
    });

    it('handles very long passwords', () => {
      const longPassword = 'a'.repeat(100);

      expect(isStrongPassword(longPassword)).toBe(true);

      const result = validateLoginForm('test@example.com', longPassword, true);
      expect(result.isValid).toBe(true);
    });

    it('handles passwords with special characters', () => {
      const specialPassword = '!@#$%^&*()_+{}|:<>?[]\\;\'\",./-';

      const result = validateLoginForm('test@example.com', specialPassword, true);
      expect(result.isValid).toBe(true);
    });
  });

  describe('API Edge Cases', () => {
    it('handles network errors in API calls', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(authAPI.login({ email: 'test@example.com', password: 'password' }))
        .rejects.toThrow('Network error');
    });

    it('handles timeout errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Request timeout'));

      await expect(authAPI.register({
        firstName: 'Jan',
        lastName: 'Kowalski',
        email: 'jan@example.com',
        password: 'password123'
      })).rejects.toThrow('Request timeout');
    });

    it('handles malformed JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => { throw new Error('Invalid JSON'); }
      });

      await expect(authAPI.login({ email: 'test@example.com', password: 'password' }))
        .rejects.toThrow('Invalid JSON');
    });

    it('handles empty response body', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => null
      });

      const result = await authAPI.login({ email: 'test@example.com', password: 'password' });
      expect(result).toBeNull();
    });
  });

  describe('Email Validation Edge Cases', () => {
    it('handles emails with multiple dots', () => {
      expect(isValidEmail('user.name.lastname@example.com')).toBe(true);
      expect(isValidEmail('user..name@example.com')).toBe(false);
    });

    it('handles emails with numbers', () => {
      expect(isValidEmail('user123@example.com')).toBe(true);
      expect(isValidEmail('123user@example.com')).toBe(true);
      expect(isValidEmail('123@example.com')).toBe(true);
    });

    it('handles emails with special characters', () => {
      expect(isValidEmail('user+tag@example.com')).toBe(true);
      expect(isValidEmail('user-name@example.com')).toBe(true);
      expect(isValidEmail('user_name@example.com')).toBe(true);
    });

    it('handles long domain names', () => {
      const longDomain = 'a'.repeat(50) + '.com';
      expect(isValidEmail(`user@${longDomain}`)).toBe(true);
    });
  });

  describe('Name Formatting Edge Cases', () => {
    it('handles names with multiple spaces', () => {
      expect(formatUserName('Jan   Maria', 'Kowalski')).toBe('Jan   Maria Kowalski');
    });

    

    it('handles very long names', () => {
      const longFirstName = 'A'.repeat(100);
      const longLastName = 'B'.repeat(100);
      const result = formatUserName(longFirstName, longLastName);
      
      expect(result).toBe(`${longFirstName} ${longLastName}`);
      expect(result.length).toBe(201); // 100 + 1 + 100
    });
  });

  describe('Authentication Edge Cases', () => {
    it('handles multiple simultaneous login attempts', async () => {
      const mockResponse = {
        access_token: 'test-token',
        user: { id: 1, email: 'test@example.com' }
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse
      });

      const promises = Array.from({ length: 5 }, () => 
        authAPI.login({ email: 'test@example.com', password: 'password' })
      );

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(5);
      results.forEach(result => {
        expect(result).toEqual(mockResponse);
      });
    });

    it('handles rapid token validation requests', async () => {
      const mockUser = { id: 1, email: 'test@example.com', role: 'user' };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockUser
      });

      const promises = Array.from({ length: 3 }, () => 
        authAPI.checkAuth('test-token')
      );

      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result).toEqual(mockUser);
      });
    });
  });
});