import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // NEXT_PUBLIC_ = nome que a integração Supabase ↔ Vercel usa pras chaves públicas.
  // Variáveis sem esses prefixos (como a service_role) nunca vão pro site.
  envPrefix: ["VITE_", "NEXT_PUBLIC_"],
});
