import { mockLocalStorage } from './mockHelpers';

// Walidacja e-maila: blokuje podwójne kropki w lokalnej części i sprawdza poprawny format
export const isValidEmail = (email) => {
    if (typeof email !== 'string' || !email) return false;
    const [local, domain] = email.split('@');
    if (!local || !domain) return false;
    if (/\.\./.test(local)) return false; // blokada user..name
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const isStrongPassword = (password) => {
    return typeof password === 'string' && password.length >= 6;
};

// Formatowanie imienia i nazwiska: zachowuje wszystkie spacje, tabulatory i nowe linie w środku, przycina tylko początek/koniec
export const formatUserName = (firstName, lastName) => {
    const f = (firstName || '').trimEnd(); // przycinamy tylko z PRAWEJ strony, by nie usuwać spacji na początku drugiego członu!
    const l = (lastName || '').trimStart(); // przycinamy tylko z LEWEJ strony
    if (!f && !l) return '';
    if (!f) return l;
    if (!l) return f;
    return `${f} ${l}`;
};

export const isAdmin = (user) => {
    return !!user && user.role === 'admin';
};

export const getStoredToken = () => {
    return mockLocalStorage.getItem('access_token');
};

export const storeUserData = (userData, token) => {
    mockLocalStorage.setItem('access_token', token);
    mockLocalStorage.setItem('user', JSON.stringify(userData));
};

export const clearUserData = () => {
    mockLocalStorage.removeItem('access_token');
    mockLocalStorage.removeItem('user');
};
