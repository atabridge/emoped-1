import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const repo = process.env.REPO_NAME || ''
export default defineConfig({
  plugins: [react()],
  base: repo ? `/${repo}/` : '/',
  build: {
    outDir: 'dist'
  }
})
