import { defineConfig } from 'vite';
import { resolve, isAbsolute } from 'path';

export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            formats: ['es'],
            fileName: () => 'index.js',
        },
        rollupOptions: {
            external: (id) => !isAbsolute(id) && !id.startsWith('.'),
        },
        outDir: 'dist',
        target: 'node24',
    },
});
