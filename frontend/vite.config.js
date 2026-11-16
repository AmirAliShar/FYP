import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The React plugin enables the automatic JSX runtime (components don't need to
// `import React`) plus Fast Refresh in dev.
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
  },
});
