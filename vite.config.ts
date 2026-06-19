import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    tailwindcss(),
    nitro({ preset: "vercel" }),
    tanstackStart({
      server: { entry: "server" },
      router: {
        quoteStyle: "double",
        codeSplittingOptions: {
          defaultBehavior: [],
        },
      },
    }),
    react(),
  ],
});
