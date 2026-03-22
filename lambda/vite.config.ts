import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        lib: {
            entry: 'src/index.ts',
            formats: ['es'],
            fileName: () => 'index.js',
        },
        rollupOptions: {
            external: (id) => !id.startsWith('.') && !id.startsWith('/'),
        },
        outDir: 'dist',
        target: 'node24',
    },
});
