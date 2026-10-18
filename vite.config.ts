import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";

export default defineConfig({
  // HTTPS so getUserMedia works when opened via LAN IP (e.g. from a phone)
  plugins: [react(), tailwindcss(), basicSsl()],
  server: { host: true, port: 5173, strictPort: true },
});
