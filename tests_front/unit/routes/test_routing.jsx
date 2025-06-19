import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../../frontend/src/context/AuthContext';
import Equipment from '../../../frontend/src/pages/Equipment/Equipment';

beforeEach(() => {
    global.fetch = vi.fn(() =>
        Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
                items: [{ id: 1, brand: 'Bosch', model: 'GBH 2-28', description: 'Wiertarka' }],
                pages: 1
            })
        })
    );
    localStorage.setItem('access_token', 'test-token');
    localStorage.setItem('user', JSON.stringify({
        email: 'test@test.com',
        first_name: 'Jan',
        last_name: 'Kowalski',
        role: 'user'
    }));
});
afterEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
});

describe('Equipment API', () => {
    it('fetches and renders equipment', async () => {
        render(
            <MemoryRouter>
                <AuthProvider>
                    <Equipment />
                </AuthProvider>
            </MemoryRouter>
        );
        await waitFor(() => {
            expect(screen.getByText(/bosch/i)).toBeInTheDocument();
            expect(screen.getByText(/wiertarka/i)).toBeInTheDocument();
        });
    });
});
