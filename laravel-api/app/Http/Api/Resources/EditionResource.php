<?php

namespace App\Http\Api\Resources;

use App\Manga\Domain\Models\Edition;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property Edition $resource
 */
class EditionResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->getId(),
            'series_id' => $this->resource->getSeriesId(),
            'name' => $this->resource->getName(),
            'publisher' => $this->resource->getPublisher(),
            'language' => $this->resource->getLanguage(),
            'total_volumes' => $this->resource->getTotalVolumes(),
        ];
    }
}
