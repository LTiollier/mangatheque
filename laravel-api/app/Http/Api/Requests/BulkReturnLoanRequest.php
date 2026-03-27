<?php

declare(strict_types=1);

namespace App\Http\Api\Requests;

use App\Borrowing\Application\DTOs\BulkReturnLoanDTO;
use App\Borrowing\Infrastructure\EloquentModels\Loan;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class BulkReturnLoanRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var array<int>|null $loanIds */
        $loanIds = $this->input('loan_ids');
        if (! is_array($loanIds)) {
            return false;
        }

        foreach ($loanIds as $loanId) {
            $loan = Loan::find($loanId);
            if (! $loan || $loan->user_id !== $this->user()?->id || $loan->returned_at !== null) {
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
            'loan_ids' => ['required', 'array', 'min:1'],
            'loan_ids.*' => ['required', 'integer', 'exists:loans,id'],
        ];
    }

    public function toDTO(): BulkReturnLoanDTO
    {
        $userId = $this->user()?->getAuthIdentifier();

        /** @var array<int> $loanIds */
        $loanIds = $this->input('loan_ids');

        return new BulkReturnLoanDTO(
            userId: is_numeric($userId) ? (int) $userId : 0,
            loanIds: array_map('intval', $loanIds),
        );
    }
}
