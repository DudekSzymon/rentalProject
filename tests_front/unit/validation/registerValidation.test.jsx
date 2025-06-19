import { describe, it, expect } from 'vitest';
import { validateRegisterForm } from '../helpers/validationHelpers';

describe('SpellBudex Auth - Register Validation', () => {
  const validForm = {
    firstName: 'Jan',
    lastName: 'Kowalski',
    email: 'jan@example.com',
    password: 'password123',
    confirm: 'password123',
    accept: true
  };

  it('validates correct register data', () => {
    const result = validateRegisterForm(validForm);

    expect(result.isValid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('validates short first name', () => {
    const result = validateRegisterForm({
      ...validForm,
      firstName: 'J'
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.firstName).toContain('minimum 2 znaki');
  });

  it('validates missing first name', () => {
    const result = validateRegisterForm({
      ...validForm,
      firstName: ''
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.firstName).toContain('minimum 2 znaki');
  });

  it('validates short last name', () => {
    const result = validateRegisterForm({
      ...validForm,
      lastName: 'K'
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.lastName).toContain('minimum 2 znaki');
  });

  it('validates missing last name', () => {
    const result = validateRegisterForm({
      ...validForm,
      lastName: ''
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.lastName).toContain('minimum 2 znaki');
  });

  it('validates invalid email format', () => {
    const result = validateRegisterForm({
      ...validForm,
      email: 'invalid-email'
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.email).toContain('Nieprawidłowy format email');
  });

  it('validates missing email', () => {
    const result = validateRegisterForm({
      ...validForm,
      email: ''
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.email).toContain('Email jest wymagany');
  });

  it('validates short password', () => {
    const result = validateRegisterForm({
      ...validForm,
      password: '123',
      confirm: '123'
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.password).toContain('minimum 6 znaków');
  });

  it('validates missing password', () => {
    const result = validateRegisterForm({
      ...validForm,
      password: '',
      confirm: ''
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.password).toContain('Hasło jest wymagane');
  });

  it('validates password mismatch', () => {
    const result = validateRegisterForm({
      ...validForm,
      confirm: 'different-password'
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.confirm).toContain('Hasła nie są takie same');
  });

  it('validates missing accept terms', () => {
    const result = validateRegisterForm({
      ...validForm,
      accept: false
    });

    expect(result.isValid).toBe(false);
    expect(result.errors.accept).toContain('Musisz zaakceptować warunki');
  });

  it('handles whitespace in names', () => {
    const result = validateRegisterForm({
      ...validForm,
      firstName: '  Jan  ',
      lastName: '  Kowalski  '
    });

    expect(result.isValid).toBe(true);
  });

  it('validates names with special characters', () => {
    const result = validateRegisterForm({
      ...validForm,
      firstName: 'Józef',
      lastName: 'Kowalski-Nowak'
    });

    expect(result.isValid).toBe(true);
  });
});