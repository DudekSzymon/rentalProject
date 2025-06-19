import { describe, it, expect } from 'vitest';
import { 
  isValidEmail, 
  isStrongPassword, 
  formatUserName, 
  isAdmin 
} from '../helpers/utilityHelpers';

describe('SpellBudex Auth - Utility Functions', () => {
  describe('Email Validation', () => {
    it('validates correct email formats', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.org')).toBe(true);
      expect(isValidEmail('123@example.com')).toBe(true);
    });

    it('rejects invalid email formats', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('test.example.com')).toBe(false);
    });
  });

  describe('Password Strength Validation', () => {
    it('validates strong passwords', () => {
      expect(isStrongPassword('password123')).toBe(true);
      expect(isStrongPassword('123456')).toBe(true);
      expect(isStrongPassword('abcdef')).toBe(true);
      expect(isStrongPassword('very-long-password-with-special-chars')).toBe(true);
    });

    it('rejects weak passwords', () => {
      expect(isStrongPassword('12345')).toBe(false);
      expect(isStrongPassword('abc')).toBe(false);
      expect(isStrongPassword('')).toBe(false);
    });

    it('handles non-string inputs', () => {
      expect(isStrongPassword(null)).toBe(false);
      expect(isStrongPassword(undefined)).toBe(false);
      expect(isStrongPassword(123456)).toBe(false);
      expect(isStrongPassword({})).toBe(false);
    });

    it('handles very long passwords', () => {
      const longPassword = 'a'.repeat(100);
      expect(isStrongPassword(longPassword)).toBe(true);
    });
  });

  describe('User Name Formatting', () => {
    it('formats complete names correctly', () => {
      expect(formatUserName('Jan', 'Kowalski')).toBe('Jan Kowalski');
      expect(formatUserName('Anna', 'Nowak')).toBe('Anna Nowak');
      expect(formatUserName('John', 'Doe')).toBe('John Doe');
    });

    it('handles partial names', () => {
      expect(formatUserName('Jan', '')).toBe('Jan');
      expect(formatUserName('', 'Kowalski')).toBe('Kowalski');
      expect(formatUserName('', '')).toBe('');
    });

    it('handles names with spaces', () => {
      expect(formatUserName('Jan Maria', 'Kowalski')).toBe('Jan Maria Kowalski');
      expect(formatUserName('Jan', 'Kowalski-Nowak')).toBe('Jan Kowalski-Nowak');
    });

      
  });

  describe('Admin Role Check', () => {
    it('correctly identifies admin users', () => {
      expect(isAdmin({ role: 'admin' })).toBe(true);
      expect(isAdmin({ role: 'admin', id: 1, email: 'admin@example.com' })).toBe(true);
    });

    it('correctly identifies non-admin users', () => {
      expect(isAdmin({ role: 'user' })).toBe(false);
      expect(isAdmin({ role: 'moderator' })).toBe(false);
      expect(isAdmin({ role: 'guest' })).toBe(false);
      expect(isAdmin({})).toBe(false);
    });

    it('handles null and undefined users', () => {
      expect(isAdmin(null)).toBe(false);
      expect(isAdmin(undefined)).toBe(false);
    });

    it('handles users without role property', () => {
      expect(isAdmin({ id: 1, email: 'user@example.com' })).toBe(false);
    });
  });
});