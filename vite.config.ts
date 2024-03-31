import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: true, // Listen on all IPv4 addresses
    port: 5173, // The port you've exposed in your Docker container
  },
  plugins: [react()],
});
