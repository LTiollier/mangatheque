export interface Series {
    id: number;
    title: string;
    authors: string[] | null;
    cover_url: string | null;
    editions?: Edition[];
    box_sets?: BoxSet[];
}

export interface Box {
    id: number;
    api_id: string | null;
    title: string;
    number: string | null;
    isbn: string | null;
    release_date: string | null;
    cover_url: string | null;
    is_empty: boolean;
    is_owned: boolean | null;
    total_volumes?: number | null;
    possessed_count?: number | null;
    volumes?: Manga[];
}

export interface BoxSet {
    id: number;
    series_id: number;
    title: string;
    publisher: string | null;
    api_id: string | null;
    cover_url?: string | null;
    boxes: Box[];
}

export interface Edition {
    id: number;
    series_id?: number;
    name: string;
    publisher: string | null;
    language: string | null;
    total_volumes: number | null;
    possessed_count?: number | null;
    possessed_numbers?: number[];
    cover_url?: string | null;
    volumes?: Manga[];
    series?: Series | null;
}

export interface MangaSearchResult {
    id: number | null;
    api_id: string | null;
    title: string;
    authors: string[] | null;
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
    is_loaned: boolean;
    loaned_to: string | null;
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

export interface GroupedSeries {
    series: Series;
    volumes: Manga[];
}
