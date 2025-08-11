import { defineConfig } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
    plugins: [
        tsconfigPaths({
            projects: ['./tsconfig.test.json']
        })
    ],
    test: {
        globals: true,
        environment: 'node',
        setupFiles: [],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
        },
        typecheck: {
            tsconfig: "./tsconfig.test.json"
        }
    },
});
