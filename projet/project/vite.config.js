import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { cloudflare } from '@cloudflare/vite-plugin'
import { syncJsonPlugin } from './vite.sync-json.js'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    syncJsonPlugin(),
    cloudflare(),
  ],
})
