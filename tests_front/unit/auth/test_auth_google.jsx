import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/context/AuthContext';

function TestGoogleComponent() {
    const { googleLogin } = useAuth();

    const handleGoogleTest = async () => {
        await googleLogin('google-test-token');
    };

    return <button data-testid="test-google" onClick={handleGoogleTest}>Test Google</button>;
}

describe('🌐 Auth Google', () => {
    it('should call googleLogin function without crashing', async () => {
        const mockResponse = {
            access_token: 'google-token',
            user: { email: 'google@test.com', role: 'user' }
        };

        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockResponse
        });

        render(
            <AuthProvider>
                <TestGoogleComponent />
            </AuthProvider>
        );

        screen.getByTestId('test-google').click();

        await waitFor(() => {
            expect(fetch).toHaveBeenCalledWith('http://localhost:8000/api/auth/google', expect.any(Object));
        });
    });
});
