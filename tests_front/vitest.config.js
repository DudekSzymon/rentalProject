﻿import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        environment: 'jsdom',
        setupFiles: ['./setup.js'],
        globals: true,
        include: ['unit/**/*.jsx'],
        testTimeout: 10000
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, '../frontend/src'),
        },
    },
    define: {
        global: 'globalThis',
    }
});
