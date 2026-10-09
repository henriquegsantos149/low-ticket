import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

const pageSlugs = ['manualrac', 'manualnovalei', 'portfoliomapas'];

function cleanPageUrls() {
  return {
    name: 'clean-page-urls',
    enforce: 'post',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url, 'http://localhost');
        const slug = url.pathname.replace(/^\//, '').replace(/\/$/, '');
        if (url.pathname === '/index.html' || pageSlugs.some(page => url.pathname === `/${page}.html`)) {
          res.writeHead(301, { Location: url.pathname === '/index.html' ? `/${url.search}` : `/${url.pathname.slice(1, -5)}/${url.search}` });
          res.end();
          return;
        }
        if (pageSlugs.includes(slug)) {
          if (!url.pathname.endsWith('/')) {
            res.writeHead(301, { Location: `/${slug}/${url.search}` });
            res.end();
            return;
          }
          req.url = `/${slug}.html${url.search}`;
        }
        next();
      });
    },
    generateBundle(_, bundle) {
      for (const slug of pageSlugs) {
        const fileName = `${slug}.html`;
        const page = bundle[fileName];
        if (page) {
          delete bundle[fileName];
          page.fileName = `${slug}/index.html`;
          bundle[page.fileName] = page;
        }
      }
      this.emitFile({ type: 'asset', fileName: '_redirects', source: '/index.html / 301!\n' + pageSlugs.map(slug => `/${slug}.html /${slug}/ 301!`).join('\n') + '\n' });
    }
  };
}

export default defineConfig({
  base: '/',
  plugins: [cleanPageUrls()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    rollupOptions: {
      input: {
        main: fileURLToPath(new URL('./index.html', import.meta.url)),
        portfoliomapas: fileURLToPath(new URL('./portfoliomapas.html', import.meta.url)),
        manualrac: fileURLToPath(new URL('./manualrac.html', import.meta.url)),
        manualnovalei: fileURLToPath(new URL('./manualnovalei.html', import.meta.url))
      }
    }
  }
});
