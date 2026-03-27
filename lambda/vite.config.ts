import { defineConfig } from 'vite';
import { resolve } from 'path';
import { builtinModules } from 'module';

export default defineConfig({
    build: {
        lib: {
            entry: resolve(__dirname, 'src/index.ts'),
            formats: ['es'],
            fileName: () => 'index.js',
        },
        rollupOptions: {
            external: (id) => builtinModules.includes(id) || id.startsWith('node:'),
        },
        outDir: 'dist',
        target: 'node24',
    },
});
