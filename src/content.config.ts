import { defineCollection, reference, z } from 'astro:content';
import { glob } from 'astro/loaders';

const photos = defineCollection({
  // One YAML file per photo; the entry id is the filename ("p08").
  loader: glob({ pattern: '*.yaml', base: './src/content/photos' }),
  schema: ({ image }) =>
    z.object({
      image: image(),
      title: z.string(),
      location: z.string(),
      year: z.string(),
      camera: z.string().optional(),
      alt: z.string().min(1),
      placeholder: z.string().regex(/^#[0-9a-f]{6}$/i),
      featured: z.number().int().positive().optional(),
    }),
});

const galleries = defineCollection({
  // Markdown frontmatter + blurb body; the entry id is the slug ("panorama-ridge").
  loader: glob({ pattern: '*.md', base: './src/content/collections' }),
  schema: z.object({
    title: z.string(),
    where: z.string(),
    cover: reference('photos'),
    photos: z.array(reference('photos')).min(1),
    order: z.number(),
  }),
});

export const collections = { photos, collections: galleries };
