<?php

namespace App\Http\Api\Resources;

use App\Manga\Domain\Models\PlanningItem;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property PlanningItem $resource
 */
class PlanningItemResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->getId(),
            'type' => $this->resource->getType(),
            'title' => $this->resource->getTitle(),
            'number' => $this->resource->getNumber(),
            'cover_url' => $this->resource->getCoverUrl(),
            'release_date' => $this->resource->getReleaseDate(),
            'series' => [
                'id' => $this->resource->getSeriesId(),
                'title' => $this->resource->getSeriesTitle(),
            ],
            'edition' => $this->resource->getEditionId() !== null ? [
                'id' => $this->resource->getEditionId(),
                'title' => $this->resource->getEditionTitle(),
            ] : null,
            'is_owned' => $this->resource->isOwned(),
            'is_wishlisted' => $this->resource->isWishlisted(),
        ];
    }
}
