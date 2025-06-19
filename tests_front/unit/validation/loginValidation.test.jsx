import { describe, it, expect } from 'vitest';
import { validateLoginForm } from '../helpers/validationHelpers';

describe('SpellBudex Auth - Login Validation', () => {
  it('validates correct login data', () => {
    const result = validateLoginForm('test@example.com', 'password123', true);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('validates incorrect email', () => {
    const result = validateLoginForm('invalid-email', 'password123', true);

    expect(result.isValid).toBe(false);
    expect(result.errors.email).toContain('Nieprawidłowy format email');
  });

  it('validates missing email', () => {
    const result = validateLoginForm('', 'password123', true);

    expect(result.isValid).toBe(false);
    expect(result.errors.email).toContain('Email jest wymagany');
  });

  it('validates short password', () => {
    const result = validateLoginForm('test@example.com', '123', true);

    expect(result.isValid).toBe(false);
    expect(result.errors.password).toContain('minimum 6 znaków');
  });

  it('validates missing password', () => {
    const result = validateLoginForm('test@example.com', '', true);

    expect(result.isValid).toBe(false);
    expect(result.errors.password).toContain('Hasło jest wymagane');
  });

  it('validates missing accept terms', () => {
    const result = validateLoginForm('test@example.com', 'password123', false);

    expect(result.isValid).toBe(false);
    expect(result.errors.accept).toContain('Musisz zaakceptować warunki');
  });
});