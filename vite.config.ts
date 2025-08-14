import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [
    react(),
    svgr({
  svgrOptions: {
    icon: true,
    // add more options here if needed
  },
}),
  // plugin added here!
  ],
  
  resolve: {
    alias: {
      images: path.resolve(__dirname, 'src/assets/images'),
      assets: path.resolve(__dirname, 'src/assets'),
      components: path.resolve(__dirname, 'src/components'),
    },
  },
  
});
