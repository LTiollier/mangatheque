<?php

namespace App\Http\Api\Resources;

use App\Manga\Domain\Models\Box;
use App\Manga\Domain\Models\BoxSet;
use App\Manga\Domain\Models\Edition;
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
            'cover_url' => $this->resource->getCoverUrl(),
            'editions' => array_map(fn (Edition $e) => [
                'id' => $e->getId(),
                'name' => $e->getName(),
                'publisher' => $e->getPublisher(),
                'total_volumes' => $e->getTotalVolumes(),
                'possessed_count' => $e->getPossessedCount(),
                'cover_url' => $e->getCoverUrl(),
                'is_wishlisted' => $e->isWishlisted(),
            ], $this->resource->getEditions()),
            'box_sets' => array_map(fn (BoxSet $bs) => [
                'id' => $bs->getId(),
                'title' => $bs->getTitle(),
                'publisher' => $bs->getPublisher(),
                'cover_url' => $bs->getCoverUrl(),
                'total_boxes' => count($bs->getBoxes()),
                'possessed_count' => count(array_filter($bs->getBoxes(), fn (Box $b) => (bool) $b->isOwned())),
                'is_wishlisted' => $bs->isWishlisted(),
            ], $this->resource->getBoxSets()),
        ];
    }
}
