import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import vercel from "@astrojs/vercel/serverless"; // or node/edge depending on your target

export default defineConfig({
  integrations: [tailwind()],
  output: "server", // ✅ Needed for headers
  adapter: vercel(),
});
