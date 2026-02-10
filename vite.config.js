import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/postcss'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/my-org-chart/', '/need-a-nap/'// 여기에 본인의 저장소 이름을 적으세요
})