import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";

// Project Pages site: https://jbadvisoryllc.github.io/jba-interactive-directory/
// Base must match the repo name since this is not a <owner>.github.io root repo.
const BASE = "/jba-interactive-directory/";

export default defineConfig({
  base: BASE,
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    outDir: "dist",
    sourcemap: true,
  },
});
