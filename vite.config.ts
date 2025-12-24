// vite.config.ts
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import svgLoader from 'vite-svg-loader'
import { resolve } from 'path'

// 将 /admin 开头的路径在 dev/preview 环境下重写到 admin.html，确保加载后台入口
const adminRewritePlugin = () => {
  const rewrite = (req: any) => {
    if (req.url?.startsWith('/admin') && !req.url.includes('.')) {
      req.url = '/admin.html'
    }
  }
  return {
    name: 'admin-rewrite',
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
    plugins: [adminRewritePlugin(), vue(), svgLoader()],
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
        },
      },
    },
  }
})
