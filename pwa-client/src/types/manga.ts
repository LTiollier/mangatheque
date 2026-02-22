export interface MangaSearchResult {
    api_id: string;
    title: string;
    authors: string[];
    description: string | null;
    published_date: string | null;
    page_count: number | null;
    cover_url: string | null;
    isbn: string | null;
}
