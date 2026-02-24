<?php

namespace App\Http\Api\Requests;

use App\Borrowing\Application\DTOs\BulkLoanMangaDTO;
use Illuminate\Foundation\Http\FormRequest;

class BulkLoanMangaRequest extends FormRequest
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
            'borrower_name' => 'required|string|max:255',
            'notes' => 'nullable|string|max:1000',
        ];
    }

    public function toDTO(): BulkLoanMangaDTO
    {
        $userId = $this->user()?->getAuthIdentifier();

        return new BulkLoanMangaDTO(
            userId: is_numeric($userId) ? (int) $userId : 0,
            volumeIds: $this->input('volume_ids'),
            borrowerName: $this->string('borrower_name')->toString(),
            notes: $this->string('notes')->toString() ?: null,
        );
    }
}
