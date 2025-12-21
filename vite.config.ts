// vite.config.ts
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import svgLoader from 'vite-svg-loader'
import { resolve } from 'path'

export default defineConfig(({ mode }) => {
  console.log('env', mode)
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [vue(), svgLoader()],
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
