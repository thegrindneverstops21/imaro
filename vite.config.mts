import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  root: "client",
  envDir: "..", // Read VITE_ settings from the project-root .env.
  server: { port: 5173 },
  build: { outDir: "../dist/client", emptyOutDir: true },
});
