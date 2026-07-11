import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Note: /api calls are relative and proxied by nginx (production) or this
// dev server (local `npm run dev`) straight to the backend container/service.
// This avoids baking API URLs into the build at build time - the same image
// works in dev, staging, and prod without rebuilding.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: process.env.VITE_DEV_API_TARGET || "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
