<?php

declare(strict_types=1);

namespace App\Http\Api\Resources;

use App\Borrowing\Domain\Models\Loan;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read Loan $resource
 */
final class LoanResource extends JsonResource
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
            'borrower_name' => $this->resource->getBorrowerName(),
            'loaned_at' => $this->resource->getLoanedAt()->format('c'),
            'returned_at' => $this->resource->getReturnedAt()?->format('c'),
            'is_returned' => $this->resource->isReturned(),
            'items' => LoanItemResource::collection($this->resource->getItems()),
        ];
    }
}
