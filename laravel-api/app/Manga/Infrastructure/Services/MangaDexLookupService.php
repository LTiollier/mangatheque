<?php

namespace App\Manga\Infrastructure\Services;

use App\Manga\Domain\Services\MangaLookupServiceInterface;
use Illuminate\Support\Facades\Http;

class MangaDexLookupService implements MangaLookupServiceInterface
{
    private const BASE_URL = 'https://api.mangadex.org';

    /**
     * @return array<int, array<string, mixed>>
     */
    public function search(string $query): array
    {
        // MangaDex API works with includes[0]=author or includes[]=author
        // Laravel's Http client with an array will produce includes[0]=author
        $response = Http::get(self::BASE_URL . '/manga', [
            'title' => $query,
            'limit' => 5,
            'includes' => ['author', 'cover_art'],
            'contentRating' => ['safe', 'suggestive', 'erotica', 'pornographic'],
        ]);

        if ($response->failed()) {
            return [];
        }

        $data = $response->json();
        if (!is_array($data) || empty($data['data']) || !is_array($data['data'])) {
            return [];
        }

        return array_map(fn (array $item) => $this->transform($item), $data['data']);
    }

    /**
     * MangaDex does not support ISBN directly. 
     */
    public function findByIsbn(string $isbn): ?array
    {
        return null;
    }

    public function findByApiId(string $apiId): ?array
    {
        $response = Http::get(self::BASE_URL . '/manga/' . $apiId, [
            'includes' => ['author', 'cover_art']
        ]);

        if ($response->failed()) {
            return null;
        }

        $data = $response->json();

        return $this->transform($data['data'] ?? []);
    }

    /**
     * @param array<string, mixed> $item
     * @return array<string, mixed>
     */
    private function transform(array $item): array
    {
        if (empty($item)) {
            return [];
        }

        $attributes = $item['attributes'] ?? [];
        $relationships = $item['relationships'] ?? [];

        // Title: try French first, then English, then original
        $title = $attributes['title']['fr'] 
            ?? $attributes['title']['en'] 
            ?? array_values($attributes['title'])[0] 
            ?? 'Unknown Title';

        // Description: try French first, then English
        $description = $attributes['description']['fr'] 
            ?? $attributes['description']['en'] 
            ?? array_values($attributes['description'])[0] 
            ?? null;

        // Authors
        $authors = [];
        foreach ($relationships as $rel) {
            if ($rel['type'] === 'author' || $rel['type'] === 'artist') {
                $authors[] = $rel['attributes']['name'] ?? 'Unknown Author';
            }
        }
        $authors = array_unique($authors);

        // Cover
        $coverUrl = null;
        foreach ($relationships as $rel) {
            if ($rel['type'] === 'cover_art') {
                $fileName = $rel['attributes']['fileName'] ?? null;
                if ($fileName) {
                    $coverUrl = "https://uploads.mangadex.org/covers/{$item['id']}/{$fileName}";
                }
            }
        }

        return [
            'api_id' => $item['id'] ?? null,
            'title' => $title,
            'authors' => $authors,
            'description' => $description,
            'status' => $attributes['status'] ?? null,
            'total_volumes' => $attributes['lastVolume'] ?? null,
            'cover_url' => $coverUrl,
        ];
    }
}
