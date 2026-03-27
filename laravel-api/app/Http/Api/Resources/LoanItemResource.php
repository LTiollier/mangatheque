<?php

declare(strict_types=1);

namespace App\Http\Api\Resources;

use App\Borrowing\Domain\Models\LoanItem;
use App\Manga\Domain\Models\Box;
use App\Manga\Domain\Models\Volume;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read LoanItem $resource
 */
final class LoanItemResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $loanableResource = null;
        $loanable = $this->resource->loanable;

        if ($loanable instanceof Volume) {
            $loanableResource = new VolumeResource($loanable);
        } elseif ($loanable instanceof Box) {
            $loanableResource = new BoxResource($loanable);
        }

        return [
            'id' => $this->resource->id,
            'loanable_type' => $this->resource->loanableType,
            'loanable_id' => $this->resource->loanableId,
            'loanable' => $loanableResource,
        ];
    }
}
