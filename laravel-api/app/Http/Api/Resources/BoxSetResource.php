<?php

namespace App\Http\Api\Resources;

use App\Manga\Domain\Models\BoxSet;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property BoxSet $resource
 */
class BoxSetResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->getId(),
            'series_id' => $this->resource->getSeriesId(),
            'title' => $this->resource->getTitle(),
            'publisher' => $this->resource->getPublisher(),
            'api_id' => $this->resource->getApiId(),
            'boxes' => BoxResource::collection($this->resource->getBoxes()),
        ];
    }
}
