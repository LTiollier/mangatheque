import { z } from "zod";

/**
 * Schemas pour la validation des réponses API (Anti-Corruption Layer)
 * 🔬 On utilise .nullable().optional() sur presque tout pour éviter de bloquer l'affichage
 * en cas de données incomplètes ou divergentes entre le backend et le frontend.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const BoxSchema: z.ZodType<any> = z.lazy(() => z.object({
    id: z.number(),
    api_id: z.string().nullable().default(null),
    title: z.string(),
    number: z.string().nullable().default(null),
    isbn: z.string().nullable().default(null),
    release_date: z.string().nullable().default(null),
    cover_url: z.string().nullable().default(null),
    is_empty: z.boolean().default(false),
    is_owned: z.boolean().nullable().default(null),
    volumes: z.array(MangaSchema).optional().default([]),
}));

export const BoxSetSchema = z.object({
    id: z.number(),
    series_id: z.number(),
    title: z.string(),
    publisher: z.string().nullable().default(null),
    api_id: z.string().nullable().default(null),
    boxes: z.array(BoxSchema).default([]),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const SeriesSchema: z.ZodType<any> = z.lazy(() => z.object({
    id: z.number(),
    title: z.string(),
    authors: z.array(z.string()).nullable().default([]),
    cover_url: z.string().nullable().default(null),
    editions: z.array(EditionSchema).optional().default([]),
    box_sets: z.array(BoxSetSchema).optional().default([]),
}));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const EditionSchema: z.ZodType<any> = z.lazy(() => z.object({
    id: z.number(),
    series_id: z.number().optional(),
    name: z.string(),
    publisher: z.string().nullable().default(null),
    language: z.string().nullable().default("fr"),
    total_volumes: z.number().nullable().default(null),
    possessed_count: z.number().nullable().default(null),
    possessed_numbers: z.array(z.number()).optional().default([]),
    cover_url: z.string().optional().nullable().default(null),
    series: SeriesSchema.optional().nullable().default(null),
    volumes: z.array(MangaSchema).optional().default([]),
}));


export const MangaSearchResultSchema = z.object({
    id: z.number().nullable().default(null),
    api_id: z.string().nullable().default(null),
    title: z.string(),
    authors: z.array(z.string()).nullable().default([]),
    description: z.string().nullable().default(null),
    published_date: z.string().nullable().default(null),
    page_count: z.number().nullable().default(null),
    cover_url: z.string().nullable().default(null),
    isbn: z.string().nullable().default(null),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const MangaSchema: z.ZodType<any> = z.lazy(() => MangaSearchResultSchema.extend({
    id: z.number(),
    number: z.string().nullable().default(null),
    is_owned: z.boolean().default(false),
    is_loaned: z.boolean().default(false),
    loaned_to: z.string().nullable().default(null),
    series: SeriesSchema.nullable().default(null),
    edition: EditionSchema.nullable().default(null),
}));

export const LoanSchema = z.object({
    id: z.number(),
    volume_id: z.number(),
    borrower_name: z.string(),
    loaned_at: z.string(),
    returned_at: z.string().nullable().default(null),
    is_returned: z.boolean().default(false),
    notes: z.string().nullable().default(null),
    volume: MangaSchema.nullable().default(null),
});

/**
 * Types inférés via Zod
 */
export type ValidatedManga = z.infer<typeof MangaSchema>;
export type ValidatedLoan = z.infer<typeof LoanSchema>;
export type ValidatedMangaSearchResult = z.infer<typeof MangaSearchResultSchema>;
