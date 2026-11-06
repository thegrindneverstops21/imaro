/**
 * VITE CONFIGURATION (the frontend dev server and build)
 *
 * `root: "client"` means Vite treats client/ as the website root, so the server
 * runs at http://localhost:5173 and `npm run build:client` writes the production
 * files to dist/client (which the Express server serves).
 */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  root: "client",
  server: { port: 5173 },
  build: { outDir: "../dist/client", emptyOutDir: true },
});
