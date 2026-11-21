import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

const root = dirname(fileURLToPath(import.meta.url));
const workspace = resolve(root, '../..');

export default defineConfig({
  root,
  publicDir: false,
  cacheDir: resolve(root, '.vite'),
  plugins: [vue()],
  resolve: { alias: { '@': resolve(workspace, 'src') } },
  server: { host: '127.0.0.1', port: 5197, strictPort: true, fs: { allow: [workspace] } },
});
