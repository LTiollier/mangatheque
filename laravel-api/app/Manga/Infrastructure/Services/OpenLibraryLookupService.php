<?php

namespace App\Manga\Infrastructure\Services;

use App\Manga\Domain\Services\MangaLookupServiceInterface;
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
            'language' => 'fre',
            'limit' => 20,
        ]);

        if ($response->failed()) {
            \Illuminate\Support\Facades\Log::error('OpenLibraryLookupService: Search failed.', [
                'query' => $query,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return [];
        }

        $data = $response->json();
        if (! is_array($data) || empty($data['docs']) || ! is_array($data['docs'])) {
            return [];
        }

        /** @var array<int, array<string, mixed>> $docs */
        $docs = $data['docs'];

        return array_map(fn (array $doc) => $this->transformSearchDoc($doc), $docs);
    }

    /**
     * @return array<string, mixed>|null
     */
    public function findByIsbn(string $isbn): ?array
    {
        $normalizedIsbn = preg_replace('/[^0-9X]/i', '', $isbn);
        if (! $normalizedIsbn) {
            return null;
        }

        $bibkey = 'ISBN:'.$normalizedIsbn;
        $response = Http::get(self::ISBN_URL, [
            'bibkeys' => $bibkey,
            'format' => 'json',
            'jscmd' => 'data',
        ]);

        if ($response->failed()) {
            \Illuminate\Support\Facades\Log::error('OpenLibraryLookupService: ISBN lookup failed.', [
                'isbn' => $normalizedIsbn,
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            return null;
        }

        $data = $response->json();
        if (! is_array($data) || empty($data[$bibkey]) || ! is_array($data[$bibkey])) {
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
        if (preg_match('/^(\/works\/|\/books\/|OL)/', $apiId)) {
            \Illuminate\Support\Facades\Log::warning('OpenLibraryLookupService: findByApiId is not fully implemented for OpenLibrary keys.', [
                'api_id' => $apiId,
            ]);

            return null;
        }

        // Fallback for ISBNs that might have been passed as api_id
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
        if (isset($doc['cover_i']) && is_scalar($doc['cover_i'])) {
            $coverUrl = 'https://covers.openlibrary.org/b/id/'.(string) $doc['cover_i'].'-L.jpg';
        }

        return [
            'api_id' => $doc['key'] ?? null,
            'title' => $doc['title'] ?? 'Unknown Title',
            'authors' => is_array($authors) ? $authors : [],
            'description' => null, // OpenLibrary search doesn't return description consistently
            'published_date' => is_scalar($doc['first_publish_year'] ?? null) ? (string) $doc['first_publish_year'] : null,
            'page_count' => is_numeric($doc['number_of_pages_median'] ?? null) ? (int) $doc['number_of_pages_median'] : null,
            'cover_url' => is_string($coverUrl) ? $coverUrl : null,
            'isbn' => is_string($isbn) ? $isbn : null,
        ];
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function transformIsbnData(array $data, string $isbn): array
    {
        $authorsRaw = $data['authors'] ?? [];
        $authors = array_map(function ($author) {
            if (! is_array($author)) {
                return '';
            }
            $name = $author['name'] ?? '';

            return is_string($name) ? $name : '';
        }, is_array($authorsRaw) ? $authorsRaw : []);

        $coverData = $data['cover'] ?? null;
        $coverUrl = is_array($coverData) ? ($coverData['large'] ?? $coverData['medium'] ?? null) : null;

        $publishDate = $data['publish_date'] ?? null;

        return [
            'api_id' => $isbn, // Use ISBN as API ID since this came from an ISBN search
            'title' => $data['title'] ?? 'Unknown Title',
            'authors' => $authors,
            'description' => $data['notes'] ?? null,
            'published_date' => is_string($publishDate) ? $publishDate : null,
            'page_count' => isset($data['number_of_pages']) && is_numeric($data['number_of_pages']) ? (int) $data['number_of_pages'] : null,
            'cover_url' => is_string($coverUrl) ? $coverUrl : null,
            'isbn' => $isbn,
        ];
    }
}
