import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@dotevolve/doc-forge': resolve(__dirname, '../src/index.ts'),
      react: resolve(__dirname, 'node_modules/react'),
      'react-dom': resolve(__dirname, 'node_modules/react-dom'),
      'react/jsx-runtime': resolve(__dirname, 'node_modules/react/jsx-runtime'),
      'react/jsx-dev-runtime': resolve(__dirname, 'node_modules/react/jsx-dev-runtime'),
      'lucide-react': resolve(__dirname, 'node_modules/lucide-react'),
      'react-to-print': resolve(__dirname, 'node_modules/react-to-print'),
      'react-toastify': resolve(__dirname, 'node_modules/react-toastify'),
      zod: resolve(__dirname, 'node_modules/zod'),
      jsbarcode: resolve(__dirname, 'node_modules/jsbarcode'),
    },
  },
  server: {
    port: 5180,
    open: false,
  },
});
