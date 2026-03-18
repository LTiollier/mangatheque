<?php

namespace App\Http\Api\Requests;

use App\Manga\Infrastructure\EloquentModels\Volume;
use App\ReadingProgress\Application\DTOs\BulkToggleReadingProgressDTO;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class BulkToggleReadingProgressRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var int[]|null $volumeIds */
        $volumeIds = $this->input('volume_ids');
        if (! is_array($volumeIds)) {
            return false;
        }

        foreach ($volumeIds as $volumeId) {
            if (! Volume::find($volumeId)) {
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
        ];
    }

    public function toDTO(): BulkToggleReadingProgressDTO
    {
        $userId = $this->user()?->getAuthIdentifier();

        /** @var int[] $volumeIds */
        $volumeIds = $this->input('volume_ids');

        return new BulkToggleReadingProgressDTO(
            userId: is_numeric($userId) ? (int) $userId : 0,
            volumeIds: $volumeIds,
        );
    }
}
