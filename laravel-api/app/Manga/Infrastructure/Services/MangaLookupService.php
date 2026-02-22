<?php

namespace App\Manga\Infrastructure\Services;

use Illuminate\Support\Facades\Http;

class MangaLookupService
{
    private const BASE_URL = 'https://www.googleapis.com/books/v1/volumes';

    /**
     * @return array<int, array<string, mixed>>
     */
    public function search(string $query): array
    {
        $response = Http::get(self::BASE_URL, [
            'q' => $query,
            'maxResults' => 10,
        ]);

        if ($response->failed()) {
            return [];
        }

        $data = $response->json();
        if (! is_array($data) || empty($data['items']) || ! is_array($data['items'])) {
            return [];
        }

        /** @var array<int, array<string, mixed>> $items */
        $items = $data['items'];

        return array_map(fn (array $item) => $this->transform($item), $items);
    }

    /**
     * @return array<string, mixed>|null
     */
    public function findByIsbn(string $isbn): ?array
    {
        $response = Http::get(self::BASE_URL, [
            'q' => 'isbn:'.$isbn,
            'maxResults' => 1,
        ]);

        if ($response->failed()) {
            return null;
        }

        $data = $response->json();

        if (! is_array($data) || empty($data['items']) || ! is_array($data['items'])) {
            return null;
        }

        /** @var array<string, mixed> $item */
        $item = $data['items'][0] ?? [];

        return $this->transform($item);
    }

    /**
     * @return array<string, mixed>|null
     */
    public function findByApiId(string $apiId): ?array
    {
        $response = Http::get(self::BASE_URL.'/'.$apiId);

        if ($response->failed()) {
            return null;
        }

        /** @var array<string, mixed> $data */
        $data = $response->json();

        return $this->transform($data);
    }

    /**
     * @param  array<string, mixed>  $item
     * @return array<string, mixed>
     */
    private function transform(array $item): array
    {
        /** @var array<string, mixed> $volumeInfo */
        $volumeInfo = $item['volumeInfo'] ?? [];

        /** @var array<int, array<string, mixed>> $rawIdentifiers */
        $rawIdentifiers = $volumeInfo['industryIdentifiers'] ?? [];

        $industryIdentifiers = collect($rawIdentifiers);

        /** @var array<string, mixed>|null $isbn13Array */
        $isbn13Array = $industryIdentifiers->where('type', 'ISBN_13')->first();
        $isbn13 = $isbn13Array['identifier'] ?? null;

        /** @var array<string, mixed>|null $isbn10Array */
        $isbn10Array = $industryIdentifiers->where('type', 'ISBN_10')->first();
        $isbn10 = $isbn10Array['identifier'] ?? null;

        $isbn = $isbn13 ?? $isbn10;

        /** @var array<string, mixed> $imageLinks */
        $imageLinks = $volumeInfo['imageLinks'] ?? [];

        return [
            'api_id' => $item['id'] ?? null,
            'title' => $volumeInfo['title'] ?? 'Unknown Title',
            'authors' => $volumeInfo['authors'] ?? [],
            'description' => $volumeInfo['description'] ?? null,
            'published_date' => $volumeInfo['publishedDate'] ?? null,
            'page_count' => $volumeInfo['pageCount'] ?? null,
            'cover_url' => $imageLinks['thumbnail'] ?? null,
            'isbn' => $isbn,
        ];
    }
}
