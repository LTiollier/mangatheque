<?php

namespace App\Http\Api\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ImportSummaryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        /** @var array<string, int>|mixed $resource */
        $resource = $this->resource;

        if (is_array($resource)) {
            return [
                'imported' => $resource['imported'] ?? 0,
                'failed' => $resource['failed'] ?? 0,
            ];
        }

        return [];
    }
}
