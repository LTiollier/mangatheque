<?php

namespace App\Http\Api\Resources;

use App\Manga\Domain\Models\Series;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property Series $resource
 */
class SeriesResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->getId(),
            'title' => $this->resource->getTitle(),
            'authors' => $this->resource->getAuthors() ? explode(', ', $this->resource->getAuthors()) : [],
            'cover_url' => $this->resource->getCoverUrl(),
            'description' => $this->resource->getDescription(),
            'status' => $this->resource->getStatus(),
            'total_volumes' => $this->resource->getTotalVolumes(),
            'editions' => EditionResource::collection($this->resource->getEditions()),
            'box_sets' => BoxSetResource::collection($this->resource->getBoxSets()),
        ];
    }
}
