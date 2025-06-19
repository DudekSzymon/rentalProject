import { render, screen } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/context/AuthContext';

function TestLogoutComponent() {
    const { logout } = useAuth();
    return <button data-testid="test-logout" onClick={logout}>Test Logout</button>;
}

describe('🚪 Auth Logout', () => {
    it('should call logout function and clear localStorage', () => {
        render(
            <AuthProvider>
                <TestLogoutComponent />
            </AuthProvider>
        );

        screen.getByTestId('test-logout').click();

        expect(localStorage.removeItem).toHaveBeenCalledWith('access_token');
    });
});
