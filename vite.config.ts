import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  server: {
    // In development, requests to /api go to the backend from the /server folder.
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
})
