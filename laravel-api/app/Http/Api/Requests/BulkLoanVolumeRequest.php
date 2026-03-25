<?php

declare(strict_types=1);

namespace App\Http\Api\Requests;

use App\Borrowing\Application\DTOs\BulkLoanVolumeDTO;
use App\Manga\Infrastructure\EloquentModels\Volume;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class BulkLoanVolumeRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var array<int, int>|null $volumeIds */
        $volumeIds = $this->input('volume_ids');
        if (! is_array($volumeIds)) {
            return false;
        }

        foreach ($volumeIds as $volumeId) {
            $volume = Volume::find($volumeId);
            if (! $volume || ! ($this->user()?->can('loan', $volume) ?? false)) {
                return false;
            }
        }

        return true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'volume_ids' => 'required|array|min:1',
            'volume_ids.*' => 'required|integer|exists:volumes,id',
            'borrower_name' => 'required|string|max:255',
        ];
    }

    public function toDTO(): BulkLoanVolumeDTO
    {
        $userId = $this->user()?->getAuthIdentifier();

        /** @var array<int, int> $volumeIds */
        $volumeIds = $this->input('volume_ids');

        return new BulkLoanVolumeDTO(
            userId: is_numeric($userId) ? (int) $userId : 0,
            volumeIds: $volumeIds,
            borrowerName: $this->string('borrower_name')->toString(),
        );
    }
}
