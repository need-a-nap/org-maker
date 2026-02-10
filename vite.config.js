import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/postcss'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // 저장소 이름이 'org-maker'라면 아래와 같이 설정합니다.
  // 이 설정이 틀리면 흰 화면이나 404 에러가 발생합니다.
  base: '/org-maker/', 
})