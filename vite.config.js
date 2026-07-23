import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const apiTarget = process.env.VITE_API_PROXY_TARGET?.trim() || process.env.VITE_API_BASE_URL?.trim() || 'http://127.0.0.1:8000';
const stripeTarget = process.env.VITE_STRIPE_PROXY_TARGET?.trim() || 'http://127.0.0.1:4242';

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  server: {
    host: '127.0.0.1',
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
        secure: false,
      },
      '/create-payment-intent': {
        target: stripeTarget,
        changeOrigin: true,
        secure: false,
      },
      '/storage': {
        target: apiTarget,
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
