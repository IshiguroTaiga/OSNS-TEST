import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      base: '/',
      plugins: [react()],
      define: {
        'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(env.VITE_GEMINI_API_KEY),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        },
        extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
      },
      server: {
        port: 3000,
        host: '0.0.0.0',
        fs: {
          strict: false,
          allow: ['.'],
        },
        hmr: true,
      },
      build: {
        outDir: 'dist',
        assetsDir: 'assets',
        emptyOutDir: true,
        rollupOptions: {
          input: {
            main: path.resolve(__dirname, 'index.html')
          }
        }
      },
      optimizeDeps: {
        include: ['react', 'react-dom', '@google/genai'],
        esbuildOptions: {
          loader: {
            '.ts': 'tsx',
            '.tsx': 'tsx',
          },
        },
      },
    };
});
