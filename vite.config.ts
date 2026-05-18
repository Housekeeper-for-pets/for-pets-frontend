import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Vite에서 React와 TailwindCSS를 사용하도록 설정합니다.
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
