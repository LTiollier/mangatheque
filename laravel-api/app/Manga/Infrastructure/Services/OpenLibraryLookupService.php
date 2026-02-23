<?php

namespace App\Manga\Infrastructure\Services;

use App\Manga\Domain\Repositories\MangaLookupServiceInterface;
use Illuminate\Support\Facades\Http;

class OpenLibraryLookupService implements MangaLookupServiceInterface
{
    private const SEARCH_URL = 'https://openlibrary.org/search.json';
    private const ISBN_URL = 'https://openlibrary.org/api/books';

    /**
     * @return array<int, array<string, mixed>>
     */
    public function search(string $query): array
    {
        $response = Http::get(self::SEARCH_URL, [
            'q' => $query,
            'limit' => 20,
        ]);

        if ($response->failed()) {
            return [];
        }

        $data = $response->json();
        if (!is_array($data) || empty($data['docs']) || !is_array($data['docs'])) {
            return [];
        }

        /** @var array<int, array<string, mixed>> $docs */
        $docs = $data['docs'];

        return array_map(fn(array $doc) => $this->transformSearchDoc($doc), $docs);
    }

    /**
     * @return array<string, mixed>|null
     */
    public function findByIsbn(string $isbn): ?array
    {
        $bibkey = 'ISBN:' . $isbn;
        $response = Http::get(self::ISBN_URL, [
            'bibkeys' => $bibkey,
            'format' => 'json',
            'jscmd' => 'data',
        ]);

        if ($response->failed()) {
            return null;
        }

        $data = $response->json();
        if (!is_array($data) || empty($data[$bibkey]) || !is_array($data[$bibkey])) {
            return null;
        }

        /** @var array<string, mixed> $item */
        $item = $data[$bibkey];

        return $this->transformIsbnData($item, $isbn);
    }

    /**
     * @return array<string, mixed>|null
     */
    public function findByApiId(string $apiId): ?array
    {
        // For OpenLibrary, apiId is usually an ISBN or a work/edition code.
        // As a fallback, try to search it. Alternatively, implement a specific endpoint call.
        // It's not typically used unless stored as an API ID. 
        // We'll treat API ID as ISBN since we mainly use ISBNs.
        return $this->findByIsbn($apiId);
    }

    /**
     * @param  array<string, mixed>  $doc
     * @return array<string, mixed>
     */
    private function transformSearchDoc(array $doc): array
    {
        $isbnList = $doc['isbn'] ?? [];
        $isbn = is_array($isbnList) && count($isbnList) > 0 ? $isbnList[0] : null;

        $authors = $doc['author_name'] ?? [];

        $coverUrl = null;
        if (isset($doc['cover_i'])) {
            $coverUrl = 'https://covers.openlibrary.org/b/id/' . $doc['cover_i'] . '-L.jpg';
        }

        return [
            'api_id' => $doc['key'] ?? null,
            'title' => $doc['title'] ?? 'Unknown Title',
            'authors' => is_array($authors) ? $authors : [],
            'description' => null, // OpenLibrary search doesn't return description consistently
            'published_date' => isset($doc['first_publish_year']) ? (string) $doc['first_publish_year'] : null,
            'page_count' => $doc['number_of_pages_median'] ?? null,
            'cover_url' => $coverUrl,
            'isbn' => $isbn,
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function transformIsbnData(array $data, string $isbn): array
    {
        $authorsRaw = $data['authors'] ?? [];
        $authors = array_map(fn($author) => $author['name'] ?? '', is_array($authorsRaw) ? $authorsRaw : []);

        $coverUrl = $data['cover']['large'] ?? $data['cover']['medium'] ?? null;

        $publishDate = $data['publish_date'] ?? null;

        return [
            'api_id' => $isbn, // Use ISBN as API ID since this came from an ISBN search
            'title' => $data['title'] ?? 'Unknown Title',
            'authors' => $authors,
            'description' => $data['notes'] ?? null,
            'published_date' => $publishDate,
            'page_count' => $data['number_of_pages'] ?? null,
            'cover_url' => $coverUrl,
            'isbn' => $isbn,
        ];
    }
}
