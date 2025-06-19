export const validateLoginForm = (email, password, accept) => {
  const errors = {};

  if (!email) {
    errors.email = 'Email jest wymagany';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Nieprawidłowy format email';
  }

  if (!password) {
    errors.password = 'Hasło jest wymagane';
  } else if (password.length < 6) {
    errors.password = 'Hasło musi mieć minimum 6 znaków';
  }

  if (!accept) {
    errors.accept = 'Musisz zaakceptować warunki';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateRegisterForm = (form) => {
  const errors = {};

  if (!form.firstName || form.firstName.trim().length < 2) {
    errors.firstName = 'Imię musi mieć minimum 2 znaki';
  }

  if (!form.lastName || form.lastName.trim().length < 2) {
    errors.lastName = 'Nazwisko musi mieć minimum 2 znaki';
  }

  if (!form.email) {
    errors.email = 'Email jest wymagany';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Nieprawidłowy format email';
  }

  if (!form.password) {
    errors.password = 'Hasło jest wymagane';
  } else if (form.password.length < 6) {
    errors.password = 'Hasło musi mieć minimum 6 znaków';
  }

  if (form.password !== form.confirm) {
    errors.confirm = 'Hasła nie są takie same';
  }

  if (!form.accept) {
    errors.accept = 'Musisz zaakceptować warunki';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};