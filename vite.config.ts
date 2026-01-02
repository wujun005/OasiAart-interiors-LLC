// vite.config.ts
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import svgLoader from 'vite-svg-loader'
import { resolve } from 'path'

// 将 /admin、/h5 等多入口路径在 dev/preview 环境下重写到对应 html，确保加载对应入口
type HtmlEntry = { prefix: string; html: string }
const htmlEntryRewritePlugin = (entries: HtmlEntry[]) => {
  const rewrite = (req: any) => {
    const match = entries.find(
      (entry) => req.url?.startsWith(entry.prefix) && !req.url.includes('.')
    )
    if (match) {
      req.url = match.html
    }
  }
  return {
    name: 'html-entry-rewrite',
    configureServer(server: any) {
      server.middlewares.use((req: any, _res: any, next: any) => {
        rewrite(req)
        next()
      })
    },
    configurePreviewServer(server: any) {
      server.middlewares.use((req: any, _res: any, next: any) => {
        rewrite(req)
        next()
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  console.log('env', mode)
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      htmlEntryRewritePlugin([
        { prefix: '/admin', html: '/admin.html' },
        { prefix: '/h5', html: '/h5.html' },
      ]),
      vue(),
      svgLoader(),
    ],
    resolve: {
      alias: { '@': resolve(__dirname, 'src') },
    },
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_PROXY_TARGET,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
    build: {
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'index.html'),
          admin: resolve(__dirname, 'admin.html'),
          h5: resolve(__dirname, 'h5.html'),
        },
      },
    },
  }
})
