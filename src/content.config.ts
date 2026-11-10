import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Every Markdown file in src/content/blog becomes a post.
const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    tags: z.array(z.string()).default([]),
    cover: z.enum(['retrieval', 'agents', 'adoption']).default('retrieval'),
    draft: z.boolean().default(false),
    series: z.string().optional(),
    part: z.number().optional(),
    image: z.string().optional(),       // link preview + card image, e.g. /img/posts/<slug>/share.jpg
    carousel: z.array(z.string()).optional(), // LinkedIn carousel slides shown in the post
  }),
});

export const collections = { blog };
