import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Set API_PROXY to a deployed site URL (e.g. https://dxxxx.cloudfront.net) to use real sync in `npm run dev`.
const apiProxy = process.env.API_PROXY

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: apiProxy ? { proxy: { '/api': { target: apiProxy, changeOrigin: true } } } : undefined,
})
