<?php

namespace App\Http\Api\Requests;

use App\Borrowing\Application\DTOs\LoanMangaDTO;
use Illuminate\Foundation\Http\FormRequest;

class LoanMangaRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
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
            'volume_id' => 'required|integer|exists:volumes,id',
            'borrower_name' => 'required|string|max:255',
            'notes' => 'nullable|string|max:1000',
        ];
    }

    public function toDTO(): LoanMangaDTO
    {
        $userId = $this->user()?->getAuthIdentifier();

        return new LoanMangaDTO(
            userId: is_numeric($userId) ? (int) $userId : 0,
            volumeId: $this->integer('volume_id'),
            borrowerName: $this->string('borrower_name')->toString(),
            notes: $this->string('notes')->toString() ?: null,
        );
    }
}
