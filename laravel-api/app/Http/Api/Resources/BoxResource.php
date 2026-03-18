<?php

namespace App\Http\Api\Resources;

use App\Manga\Domain\Models\Box;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property Box $resource
 */
class BoxResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->getId(),
            'box_set_id' => $this->resource->getBoxSetId(),
            'api_id' => $this->resource->getApiId(),
            'title' => $this->resource->getTitle(),
            'number' => $this->resource->getNumber(),
            'isbn' => $this->resource->getIsbn(),
            'release_date' => $this->resource->getReleaseDate(),
            'cover_url' => $this->resource->getCoverUrl(),
            'is_empty' => $this->resource->isEmpty(),
            'is_owned' => $this->resource->isOwned(),
            'is_wishlisted' => $this->resource->isWishlisted(),
            'total_volumes' => $this->resource->getTotalVolumes(),
            'possessed_count' => $this->resource->getPossessedCount(),
            'series_id' => $this->resource->getSeriesId(),
            'volumes' => MangaResource::collection($this->when($this->resource->getVolumes() !== [], $this->resource->getVolumes())),
        ];
    }
}
