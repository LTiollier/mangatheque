export interface Series {
    id: number;
    title: string;
    authors: string[];
    cover_url: string | null;
    status: string | null;
}

export interface Edition {
    id: number;
    name: string;
    publisher: string | null;
    language: string;
}

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

export interface Manga extends MangaSearchResult {
    id: number;
    number: string | null;
    series: Series | null;
    edition: Edition | null;
}
