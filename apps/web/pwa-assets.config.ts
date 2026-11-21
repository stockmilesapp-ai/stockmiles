import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

// Generates the app icons in public/ from public/logo-mark.svg.
// Run again only when the logo changes: pnpm --filter @stockmiles/web pwa:icons
export default defineConfig({
  preset: minimal2023Preset,
  images: ['public/logo-mark.svg'],
});
