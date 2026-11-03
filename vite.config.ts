import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  base: '/cb/',
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/mightpulse-proxy': {
        target: 'https://api.mightpulse.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/mightpulse-proxy/, ''),
      },
    },
  },
});
