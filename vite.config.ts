import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
const isNetlify = Boolean(process.env.NETLIFY);

export default defineConfig({
  base: isNetlify ? '/' : '/cb/',
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/.netlify/functions/mightpulse': {
        target: 'https://api.mightpulse.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => {
          const url = new URL(path, 'http://localhost');
          const alliance = url.searchParams.get('alliance') || url.searchParams.get('tag');
          if (alliance) {
            return `/v1/alliances/2323/${alliance.toUpperCase()}?include=info,roster`;
          }
          return '/v1/alliances/2323/ERA?include=info,roster';
        },
        headers: {
          Authorization: 'Bearer kss_0oRgcYQLGaiVkq66XHC_OI2q2d8Y4wach7udiAKk0cQ',
          'X-Api-Key': 'kss_0oRgcYQLGaiVkq66XHC_OI2q2d8Y4wach7udiAKk0cQ',
        },
      },
    },
  },
});
