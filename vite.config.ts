import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Frontend-only prototype. No proxy, no backend URL, no secrets.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, host: 'localhost' },
});
