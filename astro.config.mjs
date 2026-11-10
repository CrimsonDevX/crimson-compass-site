import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';

// Change `site` if you deploy to a different domain.
export default defineConfig({
  site: 'https://thecrimsoncompass.com',
  build: { format: 'directory' },
  integrations: [mdx()],
});
