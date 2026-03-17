<?php

namespace App\Manga\Infrastructure\Services;

use App\Manga\Infrastructure\EloquentModels\Series as EloquentSeries;
use App\Manga\Infrastructure\EloquentModels\Volume as EloquentVolume;

class EloquentMangaLookupService implements MangaLookupServiceInterface
{
    /**
     * @return array<int, array<string, mixed>>
     */
    public function search(string $query): array
    {
        $series = EloquentSeries::whereRaw('LOWER(title) LIKE ?', ['%'.strtolower($query).'%'])
            ->orWhereRaw('LOWER(authors) LIKE ?', ['%'.strtolower($query).'%'])
            ->get();

        return $series->map(fn (EloquentSeries $s) => $this->seriesToArray($s))->values()->all();
    }

    /**
     * @return array<string, mixed>|null
     */
    public function findByIsbn(string $isbn): ?array
    {
        $volume = EloquentVolume::where('isbn', $isbn)
            ->with('edition.series')
            ->first();

        return $volume ? $this->volumeToArray($volume) : null;
    }

    /**
     * @return array<string, mixed>|null
     */
    public function findByApiId(string $apiId): ?array
    {
        $volume = EloquentVolume::where('api_id', $apiId)
            ->with('edition.series')
            ->first();

        if ($volume) {
            return $this->volumeToArray($volume);
        }

        $series = EloquentSeries::where('api_id', $apiId)->first();

        return $series ? $this->seriesToArray($series) : null;
    }

    /**
     * @return array<string, mixed>
     */
    private function seriesToArray(EloquentSeries $series): array
    {
        return [
            'id' => $series->id,
            'api_id' => $series->api_id,
            'title' => $series->title,
            'authors' => $series->authors,
            'cover_url' => $series->cover_url,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function volumeToArray(EloquentVolume $volume): array
    {
        return [
            'api_id' => $volume->api_id,
            'title' => $volume->title,
            'isbn' => $volume->isbn,
            'published_date' => $volume->published_date,
            'cover_url' => $volume->cover_url,
        ];
    }
}
