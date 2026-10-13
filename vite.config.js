import { defineConfig, loadEnv } from 'vite';
import { fileURLToPath } from 'node:url';

const pageSlugs = ['manualrac', 'manualnovalei', 'portfoliomapas'];

function cleanPageUrls() {
  return {
    name: 'clean-page-urls',
    enforce: 'post',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.startsWith('/api/subscribe') && req.method === 'POST') {
          let bodyStr = '';
          req.on('data', chunk => { bodyStr += chunk; });
          req.on('end', async () => {
            try {
              const body = bodyStr ? JSON.parse(bodyStr) : {};
              const { default: subscribeHandler } = await import('./api/subscribe.js');
              const customRes = {
                statusCode: 200,
                status(code) { this.statusCode = code; return this; },
                json(data) {
                  res.statusCode = this.statusCode;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify(data));
                },
                send(data) {
                  res.statusCode = this.statusCode;
                  res.end(data);
                }
              };
              await subscribeHandler({ ...req, body }, customRes);
            } catch (err) {
              console.error('[API Subscribe Middleware Error]:', err);
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ error: err.message }));
            }
          });
          return;
        }

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

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  Object.assign(process.env, env);

  return {
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
  };
});
