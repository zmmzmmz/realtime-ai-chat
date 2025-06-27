import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: "./postcss.config.js",
  },
  // 确保在 monorepo 中正确解析依赖
  optimizeDeps: {
    include: ["@heroui/react", "framer-motion"],
  },
});
