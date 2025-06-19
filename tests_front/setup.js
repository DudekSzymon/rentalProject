import '@testing-library/jest-dom';

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock fetch
global.fetch = vi.fn();

// Mock Google OAuth
Object.defineProperty(window, 'google', {
    value: {
        accounts: {
            id: {
                initialize: vi.fn(),
                renderButton: vi.fn()
            }
        }
    }
});

// WA¯NE: Mock ALL react-router-dom hooks globalnie
const mockNavigate = vi.fn();
const mockLocation = {
    pathname: '/',
    search: '',
    hash: '',
    state: null,
    key: 'default'
};
const mockParams = {};

vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
    useParams: () => mockParams,
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
    Link: ({ children, to, ...props }) => {
        return React.createElement('a', { href: to, ...props }, children);
    },
    BrowserRouter: ({ children }) => children,
    MemoryRouter: ({ children }) => children,
    Routes: ({ children }) => children,
    Route: ({ element, children }) => element || children
}));

// Clear mocks
beforeEach(() => {
    vi.clearAllMocks();
    mockNavigate.mockClear();
});
