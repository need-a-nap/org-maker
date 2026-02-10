import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/postcss'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './', // 이 줄을 추가해야 배포 시 파일 경로를 제대로 찾습니다!
})
