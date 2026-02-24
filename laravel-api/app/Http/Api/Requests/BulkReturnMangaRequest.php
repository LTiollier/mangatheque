<?php

namespace App\Http\Api\Requests;

use App\Borrowing\Application\DTOs\BulkReturnMangaDTO;
use Illuminate\Foundation\Http\FormRequest;

class BulkReturnMangaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'volume_ids' => 'required|array|min:1',
            'volume_ids.*' => 'required|integer|exists:volumes,id',
        ];
    }

    public function toDTO(): BulkReturnMangaDTO
    {
        $userId = $this->user()?->getAuthIdentifier();

        /** @var array<int, int> $volumeIds */
        $volumeIds = $this->input('volume_ids');

        return new BulkReturnMangaDTO(
            userId: is_numeric($userId) ? (int) $userId : 0,
            volumeIds: $volumeIds,
        );
    }
}
