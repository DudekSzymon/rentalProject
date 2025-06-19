// ==========================================
// 1. tests_front/vitest.config.js
// ==========================================
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export default defineConfig({
    plugins: [react()],
    test: {
        // Podstawowe ustawienia
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./tests_front/setup.js'], // ← Poprawiona ścieżka

        // Gdzie szukać testów
        include: [
            'tests_front/**/*.{test,spec}.{js,jsx,ts,tsx}',
            'tests_front/unit/**/*.{test,spec}.{js,jsx,ts,tsx}'
        ],
        exclude: [
            '**/node_modules/**',
            'node_modules/**',
            'dist/**',
            '.git/**',
            'setup.js',
            'coverage/**'
        ],

        // Coverage configuration
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html', 'lcov'],
            reportsDirectory: './coverage',
            exclude: [
                'node_modules/',
                'tests_front/',
                '**/*.test.*',
                '**/*.spec.*',
                '**/setup.js',
                'public/',
                'dist/',
                '**/*.d.ts'
            ],
            thresholds: {
                global: {
                    branches: 50,
                    functions: 50,
                    lines: 50,
                    statements: 50
                }
            }
        },

        // Timeout settings
        testTimeout: 10000,
        hookTimeout: 10000
    },

    // Path aliases (względem tests_front/)
    resolve: {
        alias: {
            '@': path.resolve(__dirname, '../src'),
            '@components': path.resolve(__dirname, '../src/components'),
            '@pages': path.resolve(__dirname, '../src/pages'),
            '@context': path.resolve(__dirname, '../src/context'),
            '@utils': path.resolve(__dirname, '../src/utils'),
            '@services': path.resolve(__dirname, '../src/services'),
            '@assets': path.resolve(__dirname, '../src/assets')
        }
    }
})