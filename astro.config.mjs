import { defineConfig } from 'astro/config';

// Change `site` if you deploy to a different domain.
export default defineConfig({
  site: 'https://resume.thecrimsoncompass.com',
  build: { format: 'directory' },
});
