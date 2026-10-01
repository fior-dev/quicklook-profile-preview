import { defineConfig } from "vitest/config";
import { crx } from "@crxjs/vite-plugin";
import preact from "@preact/preset-vite";
import tailwindcss from "@tailwindcss/vite";
import manifest from "./manifest.json" with { type: "json" };

export default defineConfig({
  plugins: [preact(), tailwindcss(), crx({ manifest })],
  test: { environment: "happy-dom" },
});
