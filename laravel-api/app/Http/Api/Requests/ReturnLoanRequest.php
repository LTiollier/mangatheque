<?php

declare(strict_types=1);

namespace App\Http\Api\Requests;

use App\Borrowing\Application\DTOs\ReturnLoanDTO;
use App\Borrowing\Infrastructure\EloquentModels\Loan;
use Illuminate\Foundation\Http\FormRequest;

class ReturnLoanRequest extends FormRequest
{
    public function authorize(): bool
    {
        $loanId = $this->route('loan');
        $loan = Loan::query()->where('id', $loanId)->first();

        return $loan !== null
            && $loan->user_id === $this->user()?->id
            && $loan->returned_at === null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [];
    }

    public function toDTO(): ReturnLoanDTO
    {
        $userId = $this->user()?->getAuthIdentifier();

        return new ReturnLoanDTO(
            userId: is_numeric($userId) ? (int) $userId : 0,
            loanId: (int) $this->route('loan'),
        );
    }
}
