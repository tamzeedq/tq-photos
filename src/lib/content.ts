import { getCollection, getEntries, getEntry, type CollectionEntry } from 'astro:content';

export type PhotoEntry = CollectionEntry<'photos'>;

/** A photo flattened for components: `id` plus its frontmatter fields. */
export type Photo = PhotoEntry['data'] & { id: string };

export interface Gallery {
  slug: string;
  title: string;
  where: string;
  /** The markdown body as plain text (one short paragraph). */
  blurb: string;
  /** "01", "02", … by `order`. */
  num: string;
  cover: Photo;
  photos: Photo[];
  /** Derived from photos, never hand-typed. */
  count: number;
  /** "2025" or "2023–2025", from min–max photo year. */
  years: string;
  entry: CollectionEntry<'collections'>;
}

const toPhoto = (e: PhotoEntry): Photo => ({ id: e.id, ...e.data });

export const pad2 = (n: number) => String(n).padStart(2, '0');

export function yearRange(photos: Photo[]): string {
  const ys = [...new Set(photos.map((p) => p.year))].sort();
  return ys.length > 1 ? `${ys[0]}–${ys[ys.length - 1]}` : (ys[0] ?? '');
}

export async function getPhoto(id: string): Promise<Photo> {
  const e = await getEntry('photos', id);
  if (!e) throw new Error(`Unknown photo "${id}"`);
  return toPhoto(e);
}

/** Highlights, in `featured` order. */
export async function getFeatured(): Promise<Photo[]> {
  const all = await getCollection('photos', (e) => e.data.featured != null);
  return all.sort((a, b) => a.data.featured! - b.data.featured!).map(toPhoto);
}

/** All collections, sorted by `order`, with photos resolved and counts derived. */
export async function getGalleries(): Promise<Gallery[]> {
  const entries = (await getCollection('collections')).sort((a, b) => a.data.order - b.data.order);
  return Promise.all(
    entries.map(async (entry, i) => {
      const photos = (await getEntries(entry.data.photos)).map(toPhoto);
      const cover = toPhoto((await getEntry(entry.data.cover))!);
      return {
        slug: entry.id,
        title: entry.data.title,
        where: entry.data.where,
        blurb: (entry.body ?? '').trim(),
        num: pad2(i + 1),
        cover,
        photos,
        count: photos.length,
        years: yearRange(photos),
        entry,
      };
    }),
  );
}

/** Unique photos across all collections. */
export function uniquePhotoCount(galleries: Gallery[]): number {
  return new Set(galleries.flatMap((g) => g.photos.map((p) => p.id))).size;
}

/** Shortest-column-first distribution by aspect ratio (h / w). */
export function distribute<T extends { image: { width: number; height: number } }>(
  items: T[],
  cols: number,
): { item: T; index: number }[][] {
  const out = Array.from({ length: cols }, () => [] as { item: T; index: number }[]);
  const heights = Array(cols).fill(0) as number[];
  items.forEach((item, index) => {
    const k = heights.indexOf(Math.min(...heights));
    out[k].push({ item, index });
    heights[k] += item.image.height / item.image.width;
  });
  return out;
}
