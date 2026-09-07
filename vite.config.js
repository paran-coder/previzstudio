import { defineConfig } from 'vite';

const commit = (process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || '').slice(0, 8);
const buildId = commit || process.env.PREVIZ_BUILD_ID || 'local-build';
const channel = process.env.VERCEL_ENV || process.env.NODE_ENV || 'local';

export default defineConfig({
  define: {
    __PREVIZ_BUILD_ID__: JSON.stringify(buildId),
    __PREVIZ_BUILD_CHANNEL__: JSON.stringify(channel),
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    target: 'es2022',
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    }
  }
});
