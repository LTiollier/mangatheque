<?php

declare(strict_types=1);

namespace App\Http\Api\Resources;

use App\Manga\Domain\Models\Volume;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property Volume $resource
 */
final class VolumeResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $series = $this->resource->getSeries();
        $authorsStr = $series?->getAuthors();

        return [
            'id' => $this->resource->getId(),
            'api_id' => $this->resource->getApiId(),
            'isbn' => $this->resource->getIsbn(),
            'number' => $this->resource->getNumber(),
            'title' => $this->resource->getTitle(),
            'authors' => $authorsStr ? explode(', ', $authorsStr) : [],
            'published_date' => $this->resource->getPublishedDate(),
            'cover_url' => $this->resource->getCoverUrl(),
            'is_last_volume' => $this->resource->isLastVolume(),
            'is_owned' => $this->resource->isOwned(),
            'is_loaned' => $this->resource->isLoaned(),
            'loaned_to' => $this->resource->getLoanedTo(),
            'is_wishlisted' => $this->resource->isWishlisted(),
            'series' => $series ? new SeriesResource($series) : null,
            'edition' => $this->resource->getEdition() ? new EditionResource($this->resource->getEdition()) : null,
        ];
    }
}
