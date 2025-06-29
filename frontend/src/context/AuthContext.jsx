import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Sprawdź czy użytkownik jest zalogowany przy starcie
    useEffect(() => {
        const checkAuth = async () => {
            const accessToken = localStorage.getItem('access_token');
            const refreshToken = localStorage.getItem('refresh_token');
            
            if (!accessToken || !refreshToken) {
                setLoading(false);
                return;
            }

            try {
                const response = await authAPI.getMe();
                const userData = response.data;
                
                localStorage.setItem('user', JSON.stringify(userData));
                setUser({
                    ...userData,
                    isAdmin: userData.role === 'admin'
                });
            } catch (error) {
                console.error('Auth check failed:', error);
                // Nie czyścimy tokenów tutaj - pozwalamy interceptorowi spróbować odświeżyć
                if (error.response?.status !== 401) {
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    localStorage.removeItem('user');
                }
            }
            
            setLoading(false);
        };

        checkAuth();
    }, []);

    // Logowanie
    const login = async (credentials) => {
        try {
            const response = await authAPI.login(credentials);
            const data = response.data;
            
            if (data.access_token && data.refresh_token) {
                localStorage.setItem('access_token', data.access_token);
                localStorage.setItem('refresh_token', data.refresh_token);
                localStorage.setItem('user', JSON.stringify(data.user));
                setUser({
                    ...data.user,
                    isAdmin: data.user.role === 'admin'
                });
                return { success: true };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    // Google login
    const googleLogin = async (googleToken) => {
        try {
            const response = await authAPI.googleLogin(googleToken);
            const data = response.data;
            
            if (data.access_token && data.refresh_token) {
                localStorage.setItem('access_token', data.access_token);
                localStorage.setItem('refresh_token', data.refresh_token);
                localStorage.setItem('user', JSON.stringify(data.user));
                setUser({
                    ...data.user,
                    isAdmin: data.user.role === 'admin'
                });
                return { success: true };
            }
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    // Wylogowanie
    const logout = async () => {
        const refreshToken = localStorage.getItem('refresh_token');
        
        try {
            // Poinformuj serwer o wylogowaniu (unieważni refresh token)
            if (refreshToken) {
                await authAPI.logout(refreshToken);
            }
        } catch (error) {
            console.error('Logout API call failed:', error);
            // Kontynuuj wylogowanie nawet jeśli API call się nie powiódł
        }
        
        // Wyczyść dane lokalne
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        setUser(null);
    };

    // Funkcja do ręcznego odświeżenia tokenu (opcjonalna)
    const refreshToken = async () => {
        const currentRefreshToken = localStorage.getItem('refresh_token');
        
        if (!currentRefreshToken) {
            throw new Error('No refresh token available');
        }

        try {
            const response = await authAPI.refreshToken(currentRefreshToken);
            const data = response.data;
            
            localStorage.setItem('access_token', data.access_token);
            localStorage.setItem('refresh_token', data.refresh_token);
            
            return data.access_token;
        } catch (error) {
            // Jeśli odświeżenie się nie powiodło, wyloguj użytkownika
            logout();
            throw error;
        }
    };

    const value = {
        user,
        loading,
        login,
        googleLogin,
        logout,
        refreshToken,
        setUser
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};