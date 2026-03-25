<?php

declare(strict_types=1);

namespace App\Http\Api\Requests;

use App\Borrowing\Application\DTOs\LoanItemDTO;
use App\Manga\Infrastructure\EloquentModels\Box;
use App\Manga\Infrastructure\EloquentModels\Volume;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LoanItemRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $id = $this->input('loanable_id');
        $type = $this->input('loanable_type');

        if (! $id || ! $type) {
            return false;
        }

        if ($type === 'volume') {
            $volume = Volume::find($id);

            return $volume && ($this->user()?->can('loan', $volume) ?? false);
        }

        if ($type === 'box') {
            $box = Box::find($id);

            // Assuming Box has a similar policy or we check ownership directly for now
            // If BoxPolicy exists, we should use it. For now, let's check ownership.
            return $box && $this->user()?->boxes()->where('box_id', $id)->exists();
        }

        return false;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'loanable_id' => 'required|integer',
            'loanable_type' => ['required', Rule::in(['volume', 'box'])],
            'borrower_name' => 'required|string|max:255',
        ];
    }

    public function toDTO(): LoanItemDTO
    {
        $userId = $this->user()?->getAuthIdentifier();

        return new LoanItemDTO(
            userId: is_numeric($userId) ? (int) $userId : 0,
            loanableId: $this->integer('loanable_id'),
            loanableType: $this->string('loanable_type')->toString(),
            borrowerName: $this->string('borrower_name')->toString(),
        );
    }
}
