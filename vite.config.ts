import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],

  build: {
    target: "es2020",
    cssCodeSplit: true,
    reportCompressedSize: false,

    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;

          if (
            id.includes("react") ||
            id.includes("react-dom") ||
            id.includes("react-router-dom") ||
            id.includes("react-helmet-async")
          ) {
            return "vendor-react";
          }

          if (id.includes("@supabase")) {
            return "vendor-supabase";
          }

          if (id.includes("recharts")) {
            return "vendor-charts";
          }

          if (id.includes("react-quill-new") || id.includes("quill")) {
            return "vendor-editor";
          }

          if (id.includes("framer-motion")) {
            return "vendor-motion";
          }

          return "vendor";
        },
      },
    },
  },
});
