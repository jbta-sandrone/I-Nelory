import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^react$/,
        replacement: fileURLToPath(
          new URL("./node_modules/react/index.js", import.meta.url),
        ),
      },
      {
        find: /^react\/jsx-runtime$/,
        replacement: fileURLToPath(
          new URL("./node_modules/react/jsx-runtime.js", import.meta.url),
        ),
      },
      {
        find: /^react\/jsx-dev-runtime$/,
        replacement: fileURLToPath(
          new URL("./node_modules/react/jsx-dev-runtime.js", import.meta.url),
        ),
      },
      {
        find: /^react-dom$/,
        replacement: fileURLToPath(
          new URL("./node_modules/react-dom/index.js", import.meta.url),
        ),
      },
      {
        find: /^react-dom\/client$/,
        replacement: fileURLToPath(
          new URL("./node_modules/react-dom/client.js", import.meta.url),
        ),
      },
    ],
  },
  plugins: [react(), tailwindcss()],
});
