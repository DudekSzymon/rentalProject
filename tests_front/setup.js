import { expect, afterEach, vi, beforeAll, afterAll } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers)

// Cleanup after each test
afterEach(() => {
    cleanup()
    vi.clearAllMocks()
})

// ==========================================
// Global Mocks
// ==========================================

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
})

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn((key) => {
        return localStorageMock.__storage[key] || null
    }),
    setItem: vi.fn((key, value) => {
        localStorageMock.__storage[key] = value
    }),
    removeItem: vi.fn((key) => {
        delete localStorageMock.__storage[key]
    }),
    clear: vi.fn(() => {
        localStorageMock.__storage = {}
    }),
    __storage: {}
}
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
})

// Mock sessionStorage
const sessionStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
}
Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock
})

// Mock fetch
global.fetch = vi.fn(() =>
    Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({}),
        text: () => Promise.resolve(''),
    })
)

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mock-url')
global.URL.revokeObjectURL = vi.fn()

// Mock console methods (optional - to reduce noise)
global.console = {
    ...console,
    warn: vi.fn(),
    error: vi.fn(),
}

// Mock window methods
window.alert = vi.fn()
window.confirm = vi.fn()
window.prompt = vi.fn()

// Mock ResizeObserver
global.ResizeObserver = vi.fn(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}))

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}))