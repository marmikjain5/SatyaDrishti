import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'node:fs';

const ocrAssetFiles = {
  'worker.min.js': path.resolve(__dirname, 'node_modules/tesseract.js/dist/worker.min.js'),
  'tesseract-core-lstm.wasm.js': path.resolve(
    __dirname,
    'node_modules/tesseract.js-core/tesseract-core-lstm.wasm.js'
  ),
  'tesseract-core-lstm.wasm': path.resolve(
    __dirname,
    'node_modules/tesseract.js-core/tesseract-core-lstm.wasm'
  ),
  'eng.traineddata': path.resolve(__dirname, 'eng.traineddata'),
};

const localOcrAssets: Plugin = {
  name: 'local-ocr-assets',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      const fileName = req.url?.split('?')[0]?.replace(/^\/ocr\//, '');
      if (!fileName || !req.url?.startsWith('/ocr/')) {
        next();
        return;
      }
      const assetPath = fileName ? ocrAssetFiles[fileName as keyof typeof ocrAssetFiles] : undefined;
      if (!assetPath) {
        next();
        return;
      }

      fs.readFile(assetPath, (error, contents) => {
        if (error) {
          next();
          return;
        }
        res.setHeader(
          'Content-Type',
          fileName.endsWith('.js')
            ? 'text/javascript'
            : fileName.endsWith('.wasm')
              ? 'application/wasm'
              : 'application/octet-stream'
        );
        res.end(contents);
      });
    });
  },
  writeBundle() {
    const outputDirectory = path.resolve(__dirname, 'dist/ocr');
    fs.mkdirSync(outputDirectory, { recursive: true });
    for (const [fileName, sourcePath] of Object.entries(ocrAssetFiles)) {
      fs.copyFileSync(sourcePath, path.join(outputDirectory, fileName));
    }
  },
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), localOcrAssets],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
});
