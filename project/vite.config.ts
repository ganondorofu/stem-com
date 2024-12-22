import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/<stem-com>/', // リポジトリ名を実際のリポジトリ名に置き換えてください
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'], // 必要に応じて保持または削除
  },
});
