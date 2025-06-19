import { render, screen } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/context/AuthContext';

// Komponent testowy
function TestAuthComponent() {
    const { user, loading } = useAuth();
    return <div data-testid="auth-result">{loading ? 'loading' : user ? 'logged-in' : 'logged-out'}</div>;
}

describe('🔐 AuthContext', () => {
    it('should render AuthProvider and show initial state', () => {
        render(
            <AuthProvider>
                <TestAuthComponent />
            </AuthProvider>
        );

        expect(screen.getByTestId('auth-result')).toBeInTheDocument();
    });
});
