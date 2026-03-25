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
    box_set_id?: number | null;
    api_id: string | null;
    title: string;
    number: string | null;
    isbn: string | null;
    release_date: string | null;
    cover_url: string | null;
    is_empty: boolean;
    is_owned: boolean | null;
    is_wishlisted?: boolean;
    total_volumes?: number | null;
    series_id?: number | null;
    volumes?: Volume[];
    box_set?: BoxSet | null;
}

export interface BoxSet {
    id: number;
    series_id: number;
    title: string;
    publisher: string | null;
    api_id: string | null;
    cover_url?: string | null;
    boxes: Box[];
    series?: Series | null;
    is_wishlisted?: boolean;
}

export interface Edition {
    id: number;
    series_id?: number;
    name: string;
    publisher: string | null;
    language: string | null;
    total_volumes: number | null;
    released_volumes: number | null;
    possessed_count?: number | null;
    possessed_numbers?: number[];
    cover_url?: string | null;
    volumes?: Volume[];
    series?: Series | null;
    is_wishlisted?: boolean;
}

export interface VolumeSearchResult {
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

export interface PaginationMeta {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export interface PaginatedVolumeSearchResult {
    data: VolumeSearchResult[];
    meta: PaginationMeta;
}

export interface SearchEdition {
    id: number;
    name: string;
    publisher: string | null;
    total_volumes: number | null;
    possessed_count: number | null;
    cover_url: string | null;
    is_wishlisted: boolean;
}

export interface SearchBoxSet {
    id: number;
    title: string;
    publisher: string | null;
    cover_url: string | null;
    total_boxes: number;
    possessed_count: number;
    is_wishlisted?: boolean;
}

export interface SeriesSearchResult {
    id: number | null;
    api_id: string | null;
    title: string;
    authors: string[] | null;
    cover_url: string | null;
    editions: SearchEdition[];
    box_sets: SearchBoxSet[];
}

export interface PaginatedSeriesSearchResult {
    data: SeriesSearchResult[];
    meta: PaginationMeta;
}

export interface Volume extends VolumeSearchResult {
    id: number;
    number: string | null;
    is_owned: boolean;
    is_loaned: boolean;
    is_wishlisted?: boolean;
    loaned_to: string | null;
    box_title?: string | null;
    series: Series | null;
    edition: Edition | null;
}

export interface Loan {
    id: number;
    loanable_id: number;
    loanable_type: 'volume' | 'box';
    borrower_name: string;
    loaned_at: string;
    returned_at: string | null;
    is_returned: boolean;
    loanable: Volume | Box | null;
}

export interface ReadingProgress {
    id: number;
    volume_id: number;
    read_at: string;
}

export interface GroupedSeries {
    series: Series;
    volumes: Volume[];
}

export interface WishlistEditionItem extends Edition {
    type: 'edition';
}

export interface WishlistBoxItem extends Box {
    type: 'box';
}

export type WishlistItem = WishlistEditionItem | WishlistBoxItem;

// ─── Planning ─────────────────────────────────────────────────────────────────

export interface PlanningItemSeries {
    id: number;
    title: string;
}

export interface PlanningItemEdition {
    id: number;
    title: string;
}

export interface PlanningItem {
    id: number;
    type: 'volume' | 'box';
    title: string;
    number: string | null;
    cover_url: string | null;
    release_date: string;
    series: PlanningItemSeries;
    edition: PlanningItemEdition | null;
    is_owned: boolean;
    is_wishlisted: boolean;
    is_last_volume: boolean;
}

export interface PlanningMeta {
    per_page: number;
    total: number;
    next_cursor: string | null;
    has_more: boolean;
}

export interface PlanningResponse {
    data: PlanningItem[];
    meta: PlanningMeta;
}

export interface PlanningFilters {
    from?: string;
    to?: string;
    per_page?: number;
}
