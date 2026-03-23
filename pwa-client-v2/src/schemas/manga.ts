import { z } from "zod";

/**
 * Schemas pour la validation des réponses API (Anti-Corruption Layer)
 * .nullable().optional() sur les champs optionnels pour éviter de bloquer
 * l'affichage en cas de données incomplètes côté backend.
 */

 
export const BoxSchema: z.ZodType<any> = z.lazy(() => z.object({
    id: z.number(),
    box_set_id: z.number().nullable().optional().default(null),
    api_id: z.string().nullable().default(null),
    title: z.string(),
    number: z.string().nullable().default(null),
    isbn: z.string().nullable().default(null),
    release_date: z.string().nullable().default(null),
    cover_url: z.string().nullable().default(null),
    is_empty: z.boolean().default(false),
    is_owned: z.boolean().nullable().default(null),
    is_wishlisted: z.boolean().optional().default(false),
    series_id: z.number().nullable().optional().default(null),
    volumes: z.array(MangaSchema).optional().default([]),
    box_set: BoxSetSchema.optional().nullable().default(null),
}));

export const BoxSetSchema = z.object({
    id: z.number(),
    series_id: z.number(),
    title: z.string(),
    publisher: z.string().nullable().default(null),
    api_id: z.string().nullable().default(null),
    cover_url: z.string().optional().nullable().default(null),
    is_wishlisted: z.boolean().optional().default(false),
    boxes: z.array(BoxSchema).default([]),
    series: z.lazy(() => SeriesSchema).optional().nullable().default(null),
});

 
export const SeriesSchema: z.ZodType<any> = z.lazy(() => z.object({
    id: z.number(),
    title: z.string(),
    authors: z.array(z.string()).nullable().default([]),
    cover_url: z.string().nullable().default(null),
    editions: z.array(EditionSchema).optional().default([]),
    box_sets: z.array(BoxSetSchema).optional().default([]),
}));

 
export const EditionSchema: z.ZodType<any> = z.lazy(() => z.object({
    id: z.number(),
    series_id: z.number().optional(),
    name: z.string(),
    publisher: z.string().nullable().default(null),
    language: z.string().nullable().default("fr"),
    total_volumes: z.number().nullable().default(null),
    possessed_count: z.number().nullable().default(null),
    is_wishlisted: z.boolean().optional().default(false),
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

export const PaginationMetaSchema = z.object({
    current_page: z.number(),
    last_page: z.number(),
    per_page: z.number(),
    total: z.number(),
});

export const PaginatedSearchResultSchema = z.object({
    data: z.array(MangaSearchResultSchema),
    meta: PaginationMetaSchema,
});

export const SearchEditionSchema = z.object({
    id: z.number(),
    name: z.string(),
    publisher: z.string().nullable().default(null),
    total_volumes: z.number().nullable().default(null),
    possessed_count: z.number().nullable().default(null),
    cover_url: z.string().nullable().default(null),
    is_wishlisted: z.boolean().default(false),
});

export const SearchBoxSetSchema = z.object({
    id: z.number(),
    title: z.string(),
    publisher: z.string().nullable().default(null),
    cover_url: z.string().nullable().default(null),
    total_boxes: z.number().default(0),
    possessed_count: z.number().default(0),
});

export const SeriesSearchResultSchema = z.object({
    id: z.number().nullable().default(null),
    api_id: z.string().nullable().default(null),
    title: z.string(),
    authors: z.array(z.string()).nullable().default([]),
    cover_url: z.string().nullable().default(null),
    editions: z.array(SearchEditionSchema).default([]),
    box_sets: z.array(SearchBoxSetSchema).default([]),
});

export const PaginatedSeriesSearchResultSchema = z.object({
    data: z.array(SeriesSearchResultSchema),
    meta: PaginationMetaSchema,
});

 
export const MangaSchema: z.ZodType<any> = z.lazy(() => MangaSearchResultSchema.extend({
    id: z.number(),
    number: z.string().nullable().default(null),
    is_owned: z.boolean().default(false),
    is_loaned: z.boolean().default(false),
    is_wishlisted: z.boolean().optional().default(false),
    loaned_to: z.string().nullable().default(null),
    box_title: z.string().nullable().default(null),
    series: SeriesSchema.nullable().default(null),
    edition: EditionSchema.nullable().default(null),
}));

export const LoanSchema = z.object({
    id: z.number(),
    loanable_id: z.number(),
    loanable_type: z.enum(['volume', 'box']),
    borrower_name: z.string(),
    loaned_at: z.string(),
    returned_at: z.string().nullable().default(null),
    is_returned: z.boolean().default(false),
    notes: z.string().nullable().default(null),
    loanable: z.union([MangaSchema, BoxSchema]).nullable().default(null),
});

export const WishlistItemSchema = z.union([
    EditionSchema.and(z.object({ type: z.literal('edition') })),
    BoxSchema.and(z.object({ type: z.literal('box') })),
]);

export const ReadingProgressSchema = z.object({
    id: z.number(),
    volume_id: z.number(),
    read_at: z.string(),
});

export type ValidatedManga = z.infer<typeof MangaSchema>;
export type ValidatedLoan = z.infer<typeof LoanSchema>;
export type ValidatedMangaSearchResult = z.infer<typeof MangaSearchResultSchema>;

// ─── Planning ─────────────────────────────────────────────────────────────────

export const PlanningItemSeriesSchema = z.object({
    id: z.number(),
    title: z.string(),
});

export const PlanningItemEditionSchema = z.object({
    id: z.number(),
    title: z.string(),
});

export const PlanningItemSchema = z.object({
    id: z.number(),
    type: z.enum(['volume', 'box']),
    title: z.string(),
    number: z.string().nullable().default(null),
    cover_url: z.string().nullable().default(null),
    release_date: z.string(),
    series: PlanningItemSeriesSchema,
    edition: PlanningItemEditionSchema.nullable().default(null),
    is_owned: z.boolean().default(false),
    is_wishlisted: z.boolean().default(false),
});

export const PlanningMetaSchema = z.object({
    per_page: z.number(),
    total: z.number(),
    next_cursor: z.string().nullable().default(null),
    has_more: z.boolean(),
});

export const PlanningResponseSchema = z.object({
    data: z.array(PlanningItemSchema),
    meta: PlanningMetaSchema,
});
