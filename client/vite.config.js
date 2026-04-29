import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// Vite 配置仅用于本地前端调试，影响范围为 client 开发与构建流程。
export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        host: '0.0.0.0'
    }
});
