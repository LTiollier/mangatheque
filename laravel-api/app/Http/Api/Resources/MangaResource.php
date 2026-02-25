<?php

namespace App\Http\Api\Resources;

use App\Manga\Domain\Models\Volume;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property Volume $resource
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
            'number' => $this->resource->getNumber(),
            'title' => $this->resource->getTitle(),
            'authors' => $this->resource->getAuthors(),
            'description' => $this->resource->getDescription(),
            'published_date' => $this->resource->getPublishedDate(),
            'page_count' => $this->resource->getPageCount(),
            'cover_url' => $this->resource->getCoverUrl(),
            'is_owned' => $this->resource->isOwned(),
            'is_loaned' => $this->resource->isLoaned(),
            'loaned_to' => $this->resource->getLoanedTo(),
            'series' => $this->resource->getSeries() ? new SeriesResource($this->resource->getSeries()) : null,
            'edition' => $this->resource->getEdition() ? new EditionResource($this->resource->getEdition()) : null,
        ];
    }
}
