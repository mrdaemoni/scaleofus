import { defineConfig } from 'astro/config';
import { fileURLToPath } from 'node:url';
const publicPreview = process.env.PUBLISHER_PUBLIC_PREVIEW === '1';
const previewRoot = fileURLToPath(new URL('.', import.meta.url));
export default defineConfig({
  site: publicPreview ? 'https://scaleofus.com' : 'http://127.0.0.1:4322',
  base: publicPreview ? '/publisher' : '/',
  devToolbar: { enabled: false },
  vite: {
    server: { fs: { allow: [fileURLToPath(new URL('../../', import.meta.url))] } },
    resolve: { alias: [{ find: /(?:.*\/)?site\.config\.mjs$/, replacement: previewRoot + 'site.config.mjs' }] },
    plugins: [{
      name: 'local-reader-noindex', enforce: 'pre',
      transform(source, id) {
        if (id.endsWith('/src/layouts/Base.astro')) return source.replace('<head>', '<head><meta name="robots" content="noindex, nofollow" />');
      }
    }]
  }
});
