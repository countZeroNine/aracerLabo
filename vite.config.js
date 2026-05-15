import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    target: 'es2020',
    minify: 'oxc',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules/leaflet')) return 'leaflet';
          if (id.includes('node_modules/react')) return 'react-vendor';
        },
      },
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
