<?php

namespace App\Manga\Infrastructure\Services;

use Illuminate\Support\Facades\Http;

class MangaLookupService
{
    private const BASE_URL = 'https://www.googleapis.com/books/v1/volumes';

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

        if (empty($data['items'])) {
            return [];
        }

        return array_map(function ($item) {
            $volumeInfo = $item['volumeInfo'];
            $industryIdentifiers = collect($volumeInfo['industryIdentifiers'] ?? []);

            $isbn13 = $industryIdentifiers->where('type', 'ISBN_13')->first()['identifier'] ?? null;
            $isbn10 = $industryIdentifiers->where('type', 'ISBN_10')->first()['identifier'] ?? null;

            $isbn = $isbn13 ?? $isbn10;

            return [
                'api_id' => $item['id'],
                'title' => $volumeInfo['title'] ?? 'Unknown Title',
                'authors' => $volumeInfo['authors'] ?? [],
                'description' => $volumeInfo['description'] ?? null,
                'published_date' => $volumeInfo['publishedDate'] ?? null,
                'page_count' => $volumeInfo['pageCount'] ?? null,
                'cover_url' => $volumeInfo['imageLinks']['thumbnail'] ?? null,
                'isbn' => $isbn,
            ];
        }, $data['items']);
    }

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

        if (empty($data['items'])) {
            return null;
        }

        $item = $data['items'][0];
        $volumeInfo = $item['volumeInfo'];

        return [
            'api_id' => $item['id'],
            'title' => $volumeInfo['title'] ?? 'Unknown Title',
            'authors' => $volumeInfo['authors'] ?? [],
            'description' => $volumeInfo['description'] ?? null,
            'published_date' => $volumeInfo['publishedDate'] ?? null,
            'page_count' => $volumeInfo['pageCount'] ?? null,
            'cover_url' => $volumeInfo['imageLinks']['thumbnail'] ?? null,
            'isbn' => $isbn,
        ];
    }
}
