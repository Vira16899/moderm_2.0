import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from '@vitejs/plugin-vue-jsx';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import { userDetailBridge } from './server/userDetailBridge.js';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const backendUrl = env.VITE_API_PROXY_TARGET || env.VITE_API_BASE_URL || 'https://backend.factory.work.gd';
  return {
    plugins: [vue(), vueJsx(), tailwindcss(), {
      name: 'user-detail-get-body-bridge',
      configureServer(server) { server.middlewares.use(userDetailBridge(backendUrl)); },
      configurePreviewServer(server) { server.middlewares.use(userDetailBridge(backendUrl)); },
    }],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      proxy: {
        '/backend-api': {
          target: backendUrl,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/backend-api(?=\/|$)/, ''),
        },
      },
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
