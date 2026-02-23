export interface Series {
    id: number;
    title: string;
    authors: string[];
    description?: string | null;
    cover_url: string | null;
    status: string | null;
    total_volumes: number | null;
}

export interface Edition {
    id: number;
    name: string;
    publisher: string | null;
    language: string;
    total_volumes: number | null;
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
    is_owned: boolean;
    is_loaned?: boolean;
    loaned_to?: string | null;
    series: Series | null;
    edition: Edition | null;
}

export interface Loan {
    id: number;
    volume_id: number;
    borrower_name: string;
    loaned_at: string;
    returned_at: string | null;
    is_returned: boolean;
    notes: string | null;
    volume: Manga | null;
}
