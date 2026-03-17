<?php

namespace App\Http\Api\Resources;

use App\Manga\Infrastructure\EloquentModels\Box;
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
            'id' => $this->resource->id,
            'api_id' => $this->resource->api_id,
            'title' => $this->resource->title,
            'number' => $this->resource->number,
            'isbn' => $this->resource->isbn,
            'release_date' => $this->resource->release_date,
            'cover_url' => $this->resource->cover_url,
            'is_empty' => (bool) $this->resource->is_empty,
        ];
    }
}
