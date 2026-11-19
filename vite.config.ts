import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Served through the IDE's /absproxy/<port>/ path, which keeps the prefix,
  // so asset URLs must be generated under it.
  base: '/absproxy/5173/',
  server: {
    port: 5173,
    strictPort: true,
    // Allow only the IDE's CloudFront host (not `true`, which disables the check).
    allowedHosts: ['dqqmhw946abp8.cloudfront.net'],
  },
})
