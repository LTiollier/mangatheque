<?php

namespace App\Http\Api\Resources;

use App\ReadingProgress\Domain\Models\ReadingProgress;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read ReadingProgress $resource
 */
class ReadingProgressResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->getId(),
            'volume_id' => $this->resource->getVolumeId(),
            'read_at' => $this->resource->getReadAt()->format('c'),
        ];
    }
}
