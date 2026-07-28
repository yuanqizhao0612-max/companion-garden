import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { mkdirSync, writeFileSync } from 'node:fs'

const sitesWorker = () => ({
  name: 'companion-garden-sites-worker',
  closeBundle() {
    mkdirSync('dist/server', { recursive: true })
    writeFileSync(
      'dist/server/index.js',
      `export default {
  async fetch(request, env) {
    let response = await env.ASSETS.fetch(request)
    if (request.method === 'GET' && response.status === 404) {
      const url = new URL(request.url)
      url.pathname = '/'
      response = await env.ASSETS.fetch(new Request(url, request))
    }
    return response
  }
}
`,
    )
  },
})

export default defineConfig({
  plugins: [vue(), sitesWorker()],
  base: './',
  server: {
    allowedHosts: true,
  },
  build: {
    outDir: 'dist/client',
    emptyOutDir: true,
  },
})
