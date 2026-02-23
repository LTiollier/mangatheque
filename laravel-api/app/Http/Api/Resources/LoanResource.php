<?php

namespace App\Http\Api\Resources;

use App\Borrowing\Domain\Models\Loan;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read Loan $resource
 */
class LoanResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->resource->getId(),
            'volume_id' => $this->resource->getVolumeId(),
            'borrower_name' => $this->resource->getBorrowerName(),
            'loaned_at' => $this->resource->getLoanedAt()->format('c'),
            'returned_at' => $this->resource->getReturnedAt()?->format('c'),
            'is_returned' => $this->resource->isReturned(),
            'notes' => $this->resource->getNotes(),
            'volume' => $this->resource->getVolume() ? new MangaResource($this->resource->getVolume()) : null,
        ];
    }
}
