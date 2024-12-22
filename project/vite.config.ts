import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  server: {
    headers: {
      'Permissions-Policy': '', // interest-cohortを削除
    },
  },
  plugins: [react()],
  base: '/stem-com/', // 必要に応じて変更
});
