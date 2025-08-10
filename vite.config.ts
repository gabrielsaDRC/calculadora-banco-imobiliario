import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/calculadora-banco-imobiliario/',
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
