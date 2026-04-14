/**
 * Vite config for Plugin build mode
 * Builds AaaS as a standalone ESM bridge module to be loaded dynamically by the host.
 * No module federation — the host discovers and imports this plugin at runtime via plugins.json manifest.
 */
import { defineConfig } from 'vite';
import { defineConfigOptions } from 'C:/GitHub/dev-web-workspace/vite.config.common';
import { fileURLToPath, URL } from 'node:url';
import { resolve } from 'node:path';
import { cpSync } from 'node:fs';
import vue from '@vitejs/plugin-vue';

const WORKSPACE_URL = new URL('file:///C:/GitHub/dev-web-workspace/');
const DEV_MAIN_URL = new URL('file:///C:/GitHub/dev-web-main/');

const AAAS_I18N_SRC = fileURLToPath(new URL('./public/i18n', import.meta.url));
const AAAS_DIST = fileURLToPath(new URL('dist_plugins/aaas', WORKSPACE_URL));

/** Copy only AaaS's own i18n to dist — root public files are available from the host at runtime */
const copyAaaSI18n = () => ({
  name: 'copy-aaas-i18n',
  apply: 'build',
  closeBundle() {
    const dest = resolve(AAAS_DIST, 'i18n');
    cpSync(AAAS_I18N_SRC, dest, { recursive: true });
    console.log('[copy-aaas-i18n] Copied AaaS i18n to', dest);
  },
});

export default defineConfig(({ mode }) => ({
  ...defineConfigOptions,
  publicDir: false, // Root public files are available from host at runtime; AaaS i18n copied by plugin below
  define: {
    ...defineConfigOptions.define,
    'import.meta.env.VITE_PLUGIN_MODE': JSON.stringify('true'),
    __INTLIFY_JIT_COMPILATION__: false, // CSP-safe: use interpreter instead of new Function()
  },
  plugins: [
    vue(),
    copyAaaSI18n(),
  ],
  resolve: {
    extensions: ['.js', '.vue', '.json'],
    dedupe: ['vue', 'pinia', 'vue-router', '@vue/devtools-api', 'primevue', 'vue-i18n', 'primeicons', '@vueuse/core', '@tanstack/vue-query', 'axios'],
    alias: {
      /* ROOT APP (Workspace) */
      '@': fileURLToPath(new URL('src', WORKSPACE_URL)),
      '@assets': fileURLToPath(new URL('src/assets', WORKSPACE_URL)),
      '@components': fileURLToPath(new URL('src/components', WORKSPACE_URL)),
      '@layouts': fileURLToPath(new URL('src/layouts', WORKSPACE_URL)),
      '@router': fileURLToPath(new URL('src/router', WORKSPACE_URL)),
      '@stores': fileURLToPath(new URL('src/stores', WORKSPACE_URL)),
      '@views': fileURLToPath(new URL('src/views', WORKSPACE_URL)),
      '@mixins': fileURLToPath(new URL('src/mixins', WORKSPACE_URL)),
      '@enums': fileURLToPath(new URL('src/enums', WORKSPACE_URL)),
      '@lang': fileURLToPath(new URL('./src/lang', import.meta.url)),
      '@queries': fileURLToPath(new URL('src/queries', WORKSPACE_URL)),
      '@services': fileURLToPath(new URL('src/services', WORKSPACE_URL)),
      '@utils': fileURLToPath(new URL('src/utils', WORKSPACE_URL)),
      '@public': fileURLToPath(new URL('public', WORKSPACE_URL)),
      '@plugins': fileURLToPath(new URL('plugins', WORKSPACE_URL)),
      '@libs': fileURLToPath(new URL('src/libs', WORKSPACE_URL)),
      '@helpers': fileURLToPath(new URL('src/helpers', WORKSPACE_URL)),
      '#core': fileURLToPath(new URL('Products/ThinRDP/Web', DEV_MAIN_URL)),
      '#common': fileURLToPath(new URL('Products/Common', DEV_MAIN_URL)),
      /* CSP-safe: use runtime-only vue-i18n (no message compiler, no new Function()) */
      'vue-i18n': 'vue-i18n/dist/vue-i18n.runtime.esm-bundler.js',
      'workspace-lib-utils': fileURLToPath(new URL('workspace-lib-utils', WORKSPACE_URL)),
      /* Local aliases */
      '@aaas': fileURLToPath(new URL('./src', import.meta.url)),
      '@aaas_components': fileURLToPath(new URL('./src/components', import.meta.url)),
      '@aaas_layouts': fileURLToPath(new URL('./src/layouts', import.meta.url)),
      '@aaas_stores': fileURLToPath(new URL('./src/stores', import.meta.url)),
      '@aaas_views': fileURLToPath(new URL('./src/views', import.meta.url)),
      '@aaas_lang': fileURLToPath(new URL('./src/lang', import.meta.url)),
    },
  },
  build: {
    target: 'esnext',
    outDir: AAAS_DIST,
    emptyOutDir: true,
    minify: true,
    cssCodeSplit: false,
    rollupOptions: {
      input: fileURLToPath(new URL('./src/PluginBridge.js', import.meta.url)),
      output: {
        format: 'es',
        entryFileNames: 'bridge.js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]',
        minifyInternalExports: true,
      },
      preserveEntrySignatures: 'exports-only',
    },
  },
  server: {
    fs: {
      allow: [fileURLToPath(WORKSPACE_URL), fileURLToPath(DEV_MAIN_URL), fileURLToPath(new URL('.', import.meta.url))],
    },
  },
}));
