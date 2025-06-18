import React, { createContext, useContext, useState, useEffect } from 'react';

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
            const token = localStorage.getItem('access_token');
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                const response = await fetch('http://localhost:8000/api/auth/me', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (response.ok) {
                    const userData = await response.json();
                    setUser({
                        ...userData,
                        isAdmin: userData.role === 'admin'
                    });
                } else {
                    localStorage.removeItem('access_token');
                }
            } catch (error) {
                console.error('Auth check failed:', error);
                localStorage.removeItem('access_token');
            }
            
            setLoading(false);
        };

        checkAuth();
    }, []);

    // Logowanie
    const login = async (credentials) => {
        try {
            const response = await fetch('http://localhost:8000/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Błąd logowania');
            }

            const data = await response.json();
            
            if (data.access_token) {
                localStorage.setItem('access_token', data.access_token);
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
            const response = await fetch('http://localhost:8000/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ token: googleToken }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Błąd logowania przez Google');
            }

            const data = await response.json();
            
            if (data.access_token) {
                localStorage.setItem('access_token', data.access_token);
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

    const logout = () => {
        localStorage.removeItem('access_token');
        setUser(null);
    };

    const value = {
        user,
        loading,
        login,
        googleLogin,
        logout,
        setUser
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};