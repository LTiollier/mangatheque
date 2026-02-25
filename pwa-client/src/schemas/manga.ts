import { z } from "zod";

/**
 * Schemas pour la validation des réponses API (Anti-Corruption Layer)
 * 🔬 On utilise .nullable().optional() sur presque tout pour éviter de bloquer l'affichage
 * en cas de données incomplètes ou divergentes entre le backend et le frontend.
 */

export const SeriesSchema = z.object({
    id: z.number(),
    title: z.string(),
    authors: z.array(z.string()).nullable().default([]),
    description: z.string().nullable().default(null),
    cover_url: z.string().nullable().default(null),
    status: z.string().nullable().default(null),
    total_volumes: z.number().nullable().default(null),
});

export const EditionSchema = z.object({
    id: z.number(),
    name: z.string(),
    publisher: z.string().nullable().default(null),
    language: z.string().nullable().default("fr"),
    total_volumes: z.number().nullable().default(null),
});

export const MangaSearchResultSchema = z.object({
    api_id: z.string().nullable().default(null),
    title: z.string(),
    authors: z.array(z.string()).nullable().default([]),
    description: z.string().nullable().default(null),
    published_date: z.string().nullable().default(null),
    page_count: z.number().nullable().default(null),
    cover_url: z.string().nullable().default(null),
    isbn: z.string().nullable().default(null),
});

export const MangaSchema = MangaSearchResultSchema.extend({
    id: z.number(),
    number: z.string().nullable().default(null),
    is_owned: z.boolean().default(false),
    is_loaned: z.boolean().default(false),
    loaned_to: z.string().nullable().default(null),
    series: SeriesSchema.nullable().default(null),
    edition: EditionSchema.nullable().default(null),
});

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
