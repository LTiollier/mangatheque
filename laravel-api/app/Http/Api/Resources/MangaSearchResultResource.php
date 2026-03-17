<?php

namespace App\Http\Api\Resources;

use App\Manga\Domain\Models\Series;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property Series $resource
 */
class MangaSearchResultResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->getId(),
            'api_id' => $this->resource->getApiId(),
            'title' => $this->resource->getTitle(),
            'authors' => $this->resource->getAuthors() ? explode(', ', $this->resource->getAuthors()) : [],
            'description' => null,
            'published_date' => null,
            'page_count' => null,
            'cover_url' => $this->resource->getCoverUrl(),
            'isbn' => null,
        ];
    }
}
