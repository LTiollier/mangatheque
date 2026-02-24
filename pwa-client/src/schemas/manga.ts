import { z } from "zod";

/**
 * Schemas pour la validation des réponses API (Anti-Corruption Layer)
 * Alignés avec les interfaces dans src/types/manga.ts
 */

export const SeriesSchema = z.object({
    id: z.number(),
    title: z.string(),
    authors: z.array(z.string()),
    description: z.string().nullable().optional(), // Series.description est optionnel dans l'interface
    cover_url: z.string().nullable(),
    status: z.string().nullable(),
    total_volumes: z.number().nullable(),
});

export const EditionSchema = z.object({
    id: z.number(),
    name: z.string(),
    publisher: z.string().nullable(),
    language: z.string(),
    total_volumes: z.number().nullable(),
});

export const MangaSearchResultSchema = z.object({
    api_id: z.string(),
    title: z.string(),
    authors: z.array(z.string()),
    description: z.string().nullable(),
    published_date: z.string().nullable(),
    page_count: z.number().nullable(),
    cover_url: z.string().nullable(),
    isbn: z.string().nullable(),
});

export const MangaSchema = MangaSearchResultSchema.extend({
    id: z.number(),
    number: z.string().nullable(),
    is_owned: z.boolean(),
    is_loaned: z.boolean().optional(),
    loaned_to: z.string().nullable().optional(),
    series: SeriesSchema.nullable(),
    edition: EditionSchema.nullable(),
});

export const LoanSchema = z.object({
    id: z.number(),
    volume_id: z.number(),
    borrower_name: z.string(),
    loaned_at: z.string(),
    returned_at: z.string().nullable(),
    is_returned: z.boolean(),
    notes: z.string().nullable(),
    volume: MangaSchema.nullable(),
});

/**
 * Types inférés via Zod
 */
export type ValidatedManga = z.infer<typeof MangaSchema>;
export type ValidatedLoan = z.infer<typeof LoanSchema>;
export type ValidatedMangaSearchResult = z.infer<typeof MangaSearchResultSchema>;
