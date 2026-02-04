import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const API_PORT = env.API_PORT || process.env.API_PORT

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': `http://localhost:${API_PORT}`,
      },
    },
  }
})
