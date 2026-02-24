import { z } from "zod";

/**
 * Schemas pour la validation des réponses API (Anti-Corruption Layer)
 */

export const SeriesSchema = z.object({
    id: z.number(),
    title: z.string(),
    authors: z.array(z.string()),
    description: z.string().nullable().optional(),
    cover_url: z.string().nullable().optional(),
    status: z.string().nullable().optional(),
    total_volumes: z.number().nullable().optional(),
});

export const EditionSchema = z.object({
    id: z.number(),
    name: z.string(),
    publisher: z.string().nullable().optional(),
    language: z.string(),
    total_volumes: z.number().nullable().optional(),
});

export const MangaSearchResultSchema = z.object({
    api_id: z.string(),
    title: z.string(),
    authors: z.array(z.string()),
    description: z.string().nullable().optional(),
    published_date: z.string().nullable().optional(),
    page_count: z.number().nullable().optional(),
    cover_url: z.string().nullable().optional(),
    isbn: z.string().nullable().optional(),
});

// Définition récursive pour les relations si nécessaire, mais ici on reste simple
export const MangaSchema = MangaSearchResultSchema.extend({
    id: z.number(),
    number: z.string().nullable().optional(),
    is_owned: z.boolean(),
    is_loaned: z.boolean().optional(),
    loaned_to: z.string().nullable().optional(),
    series: SeriesSchema.nullable().optional(),
    edition: EditionSchema.nullable().optional(),
});

export const LoanSchema = z.object({
    id: z.number(),
    volume_id: z.number(),
    borrower_name: z.string(),
    loaned_at: z.string(),
    returned_at: z.string().nullable().optional(),
    is_returned: z.boolean(),
    notes: z.string().nullable().optional(),
    volume: MangaSchema.nullable().optional(),
});

/**
 * Types inférés via Zod
 */
export type ValidatedManga = z.infer<typeof MangaSchema>;
export type ValidatedLoan = z.infer<typeof LoanSchema>;
export type ValidatedMangaSearchResult = z.infer<typeof MangaSearchResultSchema>;
