import { defineConfig } from 'tsup';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    styles: 'src/styles/printDoc.css',
  },
  format: ['cjs', 'esm'],
  dts: false,
  clean: true,
  sourcemap: true,
  external: ['react', 'react-dom', 'lucide-react', 'react-to-print', '@dotevolve/ui-kit'],
  loader: { '.css': 'copy' },
});
