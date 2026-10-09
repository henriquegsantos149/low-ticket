import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
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
