import { defineConfig } from 'vite';
import { defineConfigOptions } from 'C:/GitHub/dev-web-workspace/vite.config.common';
import { fileURLToPath, URL } from 'node:url';
import { resolve } from 'node:path';
import { rmSync, mkdirSync, existsSync, renameSync, cpSync, statSync } from 'node:fs';
import { createReadStream } from 'node:fs';

const WORKSPACE_URL = new URL('file:///C:/GitHub/dev-web-workspace/');
const DEV_MAIN_URL = new URL('file:///C:/GitHub/dev-web-main/');
const outDir = './dist';

const copyRootI18nForAaaS = () => ({
  name: 'copy-root-i18n-for-aaas',
  apply: 'build',
  // Run in closeBundle to ensure it happens after all other build steps
  closeBundle() {
    try {
      const srcDir = resolve(fileURLToPath(WORKSPACE_URL), 'public/i18n');
      const destDir = resolve(fileURLToPath(new URL('.', import.meta.url)), `${outDir}/i18n/workspace`);

      console.log('[copyRootI18nForAaaS] Copying from', srcDir, 'to', destDir);

      // Ensure destination directory exists (clean and recreate)
      rmSync(destDir, { recursive: true, force: true });
      mkdirSync(destDir, { recursive: true });

      // Copy recursively
      if (existsSync(srcDir)) {
        cpSync(srcDir, destDir, { recursive: true });
        console.log('[copyRootI18nForAaaS] Successfully copied i18n files');
      } else {
        console.warn('[copyRootI18nForAaaS] Source directory not found:', srcDir);
      }
    } catch (err) {
      console.error('[copyRootI18nForAaaS] Failed to copy i18n:', err);
    }
  },
});

const cleanupProdFolder = () => ({
  name: 'move-index-and-cleanup-prod-folder',
  apply: 'build',
  closeBundle() {
    try {
      const distRoot = resolve(fileURLToPath(new URL('.', import.meta.url)), outDir);
      const indexHtml = resolve(distRoot, 'index-prod.html');
      const destIndex = resolve(distRoot, 'index.html');

      if (existsSync(indexHtml)) {
        // fs.rmSync(destIndex, { force: true });
        renameSync(indexHtml, destIndex);
      }
    } catch (err) {
      console.error('[cleanupProdFolder] Failed dist cleanup:', err);
    }
  },
});

export default defineConfig(({ mode }) => ({
  ...defineConfigOptions,
  plugins: [
    ...(defineConfigOptions.plugins || []),
    cleanupProdFolder(),
    copyRootI18nForAaaS(),
    {
      name: 'serve-root-i18n-in-dev',
      apply: 'serve',
      configureServer(server) {
        const mountPath = '/workspace-dev/public/i18n';
        const localDir = resolve(fileURLToPath(WORKSPACE_URL), 'public/i18n');
        server.middlewares.use(async (req, res, next) => {
          if (!req.url || !req.url.startsWith(mountPath)) return next();
          try {
            const rel = req.url.substring(mountPath.length).replace(/^\/+/, '');
            const filePath = resolve(localDir, rel || '');
            if (!existsSync(filePath) || statSync(filePath).isDirectory()) return next();
            res.setHeader('Cache-Control', 'no-cache');
            if (filePath.endsWith('.json')) res.setHeader('Content-Type', 'application/json; charset=utf-8');
            createReadStream(filePath).pipe(res);
          } catch (err) {
            console.warn('[serve-root-i18n-in-dev] failed to serve', req.url, err);
            next();
          }
        });
      },
    },
  ],
  // plugins: [vue(),
  //   svgLoader({
  //     svgo: true,
  //     svgoConfig: {
  //       plugins: [
  //         "removeDimensions",
  //         'prefixIds'
  //       ]
  //     }
  //   }),
  //   ],
  //   define: {
  //     __INTLIFY_JIT_COMPILATION__: true,
  //     __INTLIFY_DROP_MESSAGE_COMPILER__: false,
  //   },
  resolve: {
    extensions: ['.js', '.vue', '.json'],
    dedupe: [
      'vue',
      'pinia',
      'vue-router',
      '@vue/devtools-api',
      'primevue',
      'vue-i18n',
      'primeicons',
    ] /* ⚠️ Required for reactivity! */,
    // ...defineConfigOptions.resolve,
    alias: {
      // ...defineConfigOptions.resolve.alias,
      // ...aliasFromWorkspace,
      /* Dependencies */
      // 'primevue': fileURLToPath(new URL('../../node_modules/primevue', import.meta.url)),
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
  base: mode === 'production' ? './' : '/aaas-dev/',
  build: {
    ...defineConfigOptions.build,
    outDir,
    rollupOptions: {
      ...defineConfigOptions.build.rollupOptions,
      input: {
        mainAaaS: resolve(fileURLToPath(new URL('.', import.meta.url)), './index-prod.html'),
      },
      output: {
        assetFileNames: 'assets/[name][extname]',
        chunkFileNames: 'assets/[name].js', //--> remove chunk hashes at the end of filename
        entryFileNames: 'mainAaaS.js',
        manualChunks: (id) => {
          // Create a separate chunk for env.js so it can be modified after build
          if (id.includes('/src/env.js')) {
            return 'env.config';
          }

          if (id.includes('defineCoreImports.js')) {
            return 'workspace.core.define';
          }
          if (id.includes('useConsts.js')) {
            return 'workspace.core.consts';
          }
          if (id.includes('useCoreImports.js')) {
            return 'workspace.core';
          }
        },
      },
    },
  },
  server: {
    cors: true,

    // ...defineConfigOptions.server,
    fs: {
      ...defineConfigOptions.server.fs,
      allow: [fileURLToPath(WORKSPACE_URL), fileURLToPath(DEV_MAIN_URL), fileURLToPath(new URL('.', import.meta.url))],
    },
    hmr: {
      ...defineConfigOptions.server.hmr,
      clientPort: 3003,
    },
  },
}));
