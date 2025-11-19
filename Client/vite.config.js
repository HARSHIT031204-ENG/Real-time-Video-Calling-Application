import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
    https: false,
    allowedHosts: [
      "localhost",
      "*.ngrok-free.app",
      "*.ngrok-free.dev",
      "gilma-sleetiest-lyn.ngrok-free.dev"
    ],
    cors: true
  }
})