import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/context/AuthContext';

function TestLoginComponent() {
    const { login } = useAuth();

    const handleTestLogin = async () => {
        await login({ email: 'test@test.com', password: 'password123' });
    };

    return <button data-testid="test-login" onClick={handleTestLogin}>Test Login</button>;
}

describe('🔑 Auth Login', () => {
    it('should call login function without crashing', async () => {
        const mockResponse = {
            access_token: 'test-token',
            user: { email: 'test@test.com', role: 'user' }
        };

        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse
        });

        render(
            <AuthProvider>
                <TestLoginComponent />
            </AuthProvider>
        );

        screen.getByTestId('test-login').click();

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith('http://localhost:8000/api/auth/login', expect.any(Object));
        });
    });
});
