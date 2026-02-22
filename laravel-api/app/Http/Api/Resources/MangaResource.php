<?php

namespace App\Http\Api\Resources;

use App\Manga\Domain\Models\Manga;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property Manga $resource
 */
class MangaResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->getId(),
            'api_id' => $this->resource->getApiId(),
            'isbn' => $this->resource->getIsbn(),
            'title' => $this->resource->getTitle(),
            'authors' => $this->resource->getAuthors(),
            'description' => $this->resource->getDescription(),
            'published_date' => $this->resource->getPublishedDate(),
            'page_count' => $this->resource->getPageCount(),
            'cover_url' => $this->resource->getCoverUrl(),
        ];
    }
}
