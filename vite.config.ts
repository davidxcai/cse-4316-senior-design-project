import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import { tanstackRouter } from "@tanstack/router-plugin/vite";

export default defineConfig({
  // Router plugin must come before react() so generated routes are transformed.
  // HTTPS so getUserMedia works when opened via LAN IP (e.g. from a phone)
  plugins: [
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
    basicSsl(),
  ],
  server: { host: true, port: 5173, strictPort: true },
});
