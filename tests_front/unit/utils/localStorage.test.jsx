import { describe, it, expect, beforeEach } from 'vitest';
import { 
  getStoredToken, 
  storeUserData, 
  clearUserData 
} from '../helpers/utilityHelpers';
import { mockLocalStorage, resetAllMocks } from '../helpers/mockHelpers';

describe('SpellBudex Auth - LocalStorage Functions', () => {
  beforeEach(() => {
    resetAllMocks();
  });

  describe('Token Storage', () => {
    it('gets stored token', () => {
      mockLocalStorage.getItem.mockReturnValue('stored-token');

      const token = getStoredToken();

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('access_token');
      expect(token).toBe('stored-token');
    });

    it('returns null when no token stored', () => {
      mockLocalStorage.getItem.mockReturnValue(null);

      const token = getStoredToken();

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('access_token');
      expect(token).toBeNull();
    });
  });

  describe('User Data Storage', () => {
    it('stores user data correctly', () => {
      const userData = { id: 1, email: 'test@example.com', role: 'user' };
      const token = 'new-token';

      storeUserData(userData, token);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('access_token', 'new-token');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(userData));
      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(2);
    });

    it('stores complex user data', () => {
      const userData = { 
        id: 1, 
        email: 'test@example.com', 
        role: 'admin',
        profile: {
          firstName: 'John',
          lastName: 'Doe',
          preferences: { theme: 'dark' }
        }
      };
      const token = 'complex-token';

      storeUserData(userData, token);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('access_token', 'complex-token');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(userData));
    });

    it('handles empty user data', () => {
      const userData = {};
      const token = 'empty-token';

      storeUserData(userData, token);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('access_token', 'empty-token');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(userData));
    });
  });

  describe('User Data Clearing', () => {
    it('clears user data', () => {
      clearUserData();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('access_token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledTimes(2);
    });

    it('clears data even when nothing is stored', () => {
      clearUserData();

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('access_token');
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user');
    });
  });
});